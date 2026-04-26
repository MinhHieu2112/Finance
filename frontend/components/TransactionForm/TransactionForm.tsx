import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../Button/Button';
import { Plus, Trash2, X } from 'lucide-react';
import { ToastModal } from '../ToastModal/ToastModal';
import {
  TransactionFrequency,
  TransactionType,
} from './types';
import type {
  CategoryOption,
  Transaction,
  TransactionFormProps,
  TransactionDetailInput,
  TransactionPayload,
} from './types';

// Tạo ID cho từng row
const createRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const getTodayISO = () => new Date().toISOString().split('T')[0];

const toDateInputValue = (dateValue?: string) => {
  if (!dateValue) {
    return getTodayISO();
  }

  const parsedDate = new Date(dateValue);
  if (Number.isNaN(parsedDate.getTime())) {
    return dateValue.slice(0, 10) || getTodayISO();
  }

  return parsedDate.toISOString().split('T')[0];
};

const createEmptyDetail = (defaultCategoryId = ''): TransactionDetailInput => ({
  id: createRowId(),
  categoryId: defaultCategoryId,
  quantity: '1',
  amount: '',
  name: '',
});

const buildInitialDetails = (
  categoryOptions: CategoryOption[],
  type: TransactionType,
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
): TransactionDetailInput[] => {
  const filteredCategoryOptions = categoryOptions.filter((category) => category.type === type);
  const defaultCategoryId = filteredCategoryOptions[0]?._id || '';

  if (transaction?.details?.length) {
    return transaction.details.map((detail) => ({
      id: createRowId(),
      categoryId: detail.categoryId || defaultCategoryId,
      quantity: String(detail.quantity ?? 1),
      amount: String(detail.amount ?? 0),
      name: detail.name || '',
    }));
  }

  if (payload?.details?.length) {
    return payload.details.map((detail) => ({
      id: createRowId(),
      categoryId: detail.categoryId || defaultCategoryId,
      quantity: String(detail.quantity ?? 1),
      amount: String(detail.amount ?? 0),
      name: detail.name || '',
    }));
  }

  return [createEmptyDetail(defaultCategoryId)];
};

const getInitialDescription = (
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
) => transaction?.description || payload?.description || '';

const getInitialType = (
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
) => transaction?.type || payload?.type || TransactionType.EXPENSE;

const getInitialFrequency = (
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
) => transaction?.frequency || payload?.frequency || TransactionFrequency.ONE_TIME;

const getInitialDate = (
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
) => toDateInputValue(transaction?.date || payload?.date);

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  onClose,
  categoryOptions,
  onManageCategories,
  mode = 'create',
  initialTransaction = null,
  initialPayload = null,
}) => {
  const [description, setDescription] = useState(getInitialDescription(initialTransaction, initialPayload));
  const [type, setType] = useState<TransactionType>(getInitialType(initialTransaction, initialPayload));
  const [frequency, setFrequency] = useState<TransactionFrequency>(
    getInitialFrequency(initialTransaction, initialPayload),
  );
  const [date, setDate] = useState(getInitialDate(initialTransaction, initialPayload));
  const [details, setDetails] = useState<TransactionDetailInput[]>(
    buildInitialDetails(categoryOptions, getInitialType(initialTransaction, initialPayload), initialTransaction, initialPayload),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [pendingEditPayload, setPendingEditPayload] = useState<TransactionPayload | null>(null);

  const filteredCategoryOptions = useMemo(
    () => categoryOptions.filter((category) => category.type === type),
    [categoryOptions, type],
  );

  const groupedCategoryOptions = useMemo(() => {
    const groups = new Map<string, CategoryOption[]>();

    filteredCategoryOptions.forEach((category) => {
      const groupName = category.catalogName || 'Uncategorized Catalog';
      const current = groups.get(groupName) || [];
      current.push(category);
      groups.set(groupName, current);
    });

    return Array.from(groups.entries())
      .map(([catalogName, options]) => ({
        catalogName,
        options: options.sort((a, b) => a.name.localeCompare(b.name, 'en')),
      }))
      .sort((a, b) => a.catalogName.localeCompare(b.catalogName, 'en'));
  }, [filteredCategoryOptions]);

  useEffect(() => {
    const initialType = getInitialType(initialTransaction, initialPayload);
    setDescription(getInitialDescription(initialTransaction, initialPayload));
    setType(initialType);
    setFrequency(getInitialFrequency(initialTransaction, initialPayload));
    setDate(getInitialDate(initialTransaction, initialPayload));
    setDetails(buildInitialDetails(categoryOptions, initialType, initialTransaction, initialPayload));
  }, [initialTransaction, initialPayload, mode, categoryOptions]);

  useEffect(() => {
    setDetails((prevDetails) => prevDetails.map((detail) => {
      if (detail.categoryId && filteredCategoryOptions.some((category) => category._id === detail.categoryId)) {
        return detail;
      }

      return {
        ...detail,
        categoryId: filteredCategoryOptions[0]?._id || '',
      };
    }));
  }, [filteredCategoryOptions]);

  const updateDetail = (detailId: string, patch: Partial<TransactionDetailInput>) => {
    setDetails((prevDetails) => prevDetails.map((detail) => (
      detail.id === detailId ? { ...detail, ...patch } : detail
    )));
  };

  const addDetailAfter = (index: number) => {
    setDetails((prevDetails) => {
      const nextDetails = [...prevDetails];
      nextDetails.splice(index + 1, 0, createEmptyDetail(filteredCategoryOptions[0]?._id || ''));
      return nextDetails;
    });
  };

  const removeDetail = (detailId: string) => {
    setDetails((prevDetails) => {
      if (prevDetails.length <= 1) {
        return prevDetails;
      }

      return prevDetails.filter((detail) => detail.id !== detailId);
    });
  };

  const totalAmountPreview = details.reduce((sum, detail) => {
    const amountValue = Number.parseFloat(detail.amount);
    const quantityValue = Number.parseInt(detail.quantity, 10);
    return Number.isFinite(amountValue) && amountValue >= 0 && Number.isFinite(quantityValue) && quantityValue > 0
      ? sum + amountValue * quantityValue
      : sum;
  }, 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const normalizedDetails = details.map((detail) => {
      const matchedCategory = categoryOptions.find((category) => category._id === detail.categoryId);
      return {
        categoryId: detail.categoryId,
        categoryName: matchedCategory?.name || '',
        quantity: Number.parseInt(detail.quantity, 10) || 1,
        amount: Number.parseFloat(detail.amount) || 0,
        name: detail.name,
      };
    });

    const payload: TransactionPayload = {
      description,
      type,
      frequency,
      date,
      total_amount: normalizedDetails.reduce((sum, detail) => sum + (detail.amount * detail.quantity), 0),
      details: normalizedDetails,
    };

    if (mode === 'edit') {
      setPendingEditPayload(payload);
      setIsEditConfirmOpen(true);
      return;
    }

    try {
      setSubmitError(null);
      setIsSubmitting(true);
      await onSave(payload);
      onClose('saved');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmEdit = async () => {
    if (!pendingEditPayload) {
      return;
    }

    try {
      setSubmitError(null);
      setIsSubmitting(true);
      await onSave(pendingEditPayload);
      setIsEditConfirmOpen(false);
      setPendingEditPayload(null);
      onClose('saved');
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to update transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#fcfcfd] rounded-[32px] w-full max-w-5xl relative shadow-2xl animate-fade-in-up max-h-[95vh] flex flex-col overflow-hidden border border-white">
        
        {/* Header - Sticky */}
        <div className="px-8 py-6 flex justify-between items-center border-b border-gray-100 bg-white/80 backdrop-blur-md">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              {mode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Tạo giao dịch mới'}
            </h2>
            <p className="text-sm text-gray-500 font-medium">Cập nhật dòng tiền của bạn một cách chính xác</p>
          </div>
          <button 
            onClick={() => onClose('cancelled')} 
            className="p-2.5 rounded-full hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 overflow-y-auto flex-1 custom-scrollbar">
          
          {/* SECTION 1: THÔNG TIN CHUNG */}
          <div className={"bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"}>
            <div className="grid grid-cols-12 gap-5">
              <div className="col-span-12 xl:col-span-3">
                <label className={"block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1"}>Phân loại</label>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.EXPENSE)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === TransactionType.EXPENSE ? 'bg-white shadow-sm text-red-500' : 'text-gray-500'}`}
                  >
                    Chi phí
                  </button>
                  <button
                    type="button"
                    onClick={() => setType(TransactionType.INCOME)}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${type === TransactionType.INCOME ? 'bg-white shadow-sm text-emerald-500' : 'text-gray-500'}`}
                  >
                    Thu nhập
                  </button>
                </div>
              </div>

              <div className="col-span-12 xl:col-span-5 text-left">
                <label className={"block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1"}>Mô tả chính</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className={"w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 outline-none text-sm text-gray-700"}
                  placeholder="Ví dụ: Shopping cuối tuần, Lương tháng..."
                />
              </div>

              <div className="col-span-6 xl:col-span-2">
                <label className={"block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1"}>Ngày</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={"w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 outline-none text-sm text-gray-700"} />
              </div>

              <div className="col-span-6 xl:col-span-2 text-left">
                <label className={"block text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 ml-1"}>Định kỳ</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as TransactionFrequency)}
                  className={"w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 outline-none text-sm text-gray-700"}
                >
                  <option value={TransactionFrequency.ONE_TIME}>Một lần</option>
                  <option value={TransactionFrequency.MONTHLY}>Hàng tháng</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: CHI TIẾT GIAO DỊCH */}
          <div className="mb-8 text-left">
            <div className="flex items-center justify-between mb-4 px-2">
              <h3 className="text-sm font-black text-gray-700 uppercase tracking-widest">Danh sách chi tiết</h3>
              <span className="text-[11px] font-bold px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md uppercase">
                {details.length} hạng mục
              </span>
            </div>

            <div className="space-y-3">
              {details.map((detail, index) => (
                <div key={detail.id} className="group relative flex flex-wrap xl:flex-nowrap gap-4 p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 hover:shadow-md transition-all duration-300 items-start">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase">Hạng mục</label>
                    <select
                      value={detail.categoryId}
                      onChange={(e) => updateDetail(detail.id, { categoryId: e.target.value })}
                      className={"w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 outline-none text-sm text-gray-700"}
                    >
                      {groupedCategoryOptions.map((group) => (
                        <optgroup key={group.catalogName} label={group.catalogName}>
                          {group.options.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="w-24">
                    <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase">Số lượng</label>
                    <input
                      type="number"
                      value={detail.quantity}
                      onChange={(e) => updateDetail(detail.id, { quantity: e.target.value })}
                      className={`${"w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 outline-none text-sm text-gray-700"} text-center`}
                    />
                  </div>

                  <div className="w-40">
                    <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase">Đơn giá (VND)</label>
                    <input
                      type="number"
                      value={detail.amount}
                      onChange={(e) => updateDetail(detail.id, { amount: e.target.value })}
                      className={`${"w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 outline-none text-sm text-gray-700"} font-semibold text-right`}
                    />
                  </div>

                  <div className="flex-1 min-w-[200px]">
                    <label className="text-[10px] font-bold text-gray-400 ml-1 mb-1 block uppercase">Ghi chú chi tiết</label>
                    <input
                      type="text"
                      value={detail.name}
                      onChange={(e) => updateDetail(detail.id, { name: e.target.value })}
                      className={"w-full px-4 py-2.5 bg-gray-50 border-0 rounded-xl ring-1 ring-gray-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all duration-200 outline-none text-sm text-gray-700"}
                      placeholder="..."
                    />
                  </div>

                  <div className="flex gap-2 pt-5">
                    <button
                      type="button"
                      onClick={() => addDetailAfter(index)}
                      className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors"
                    >
                      <Plus size={20} />
                    </button>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDetail(detail.id)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={20} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer - Sticky với Tổng tiền nổi bật */}
        <div className="px-8 py-6 bg-white border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_-4px_20px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-50 rounded-2xl">
              <div className="text-[10px] font-black text-indigo-400 uppercase leading-none mb-1">Tổng cộng dự tính</div>
              <div className="text-2xl font-black text-indigo-600 tracking-tight">
                {Math.round(totalAmountPreview).toLocaleString('vi-VN')} 
                <span className="text-sm ml-1.5 opacity-70 italic font-medium">VND</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onClose('cancelled')}
              className="px-6 py-3 text-sm font-bold text-gray-500 hover:text-gray-700 transition-colors"
            >
              Hủy bỏ
            </button>
            <Button
              type="submit"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="flex-1 md:flex-none px-10 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95"
            >
              {mode === 'edit' ? 'Cập nhật giao dịch' : 'Lưu giao dịch'}
            </Button>
          </div>
        </div>

        {/* RE-INSERTED MODALS */}
      <ToastModal
        isOpen={isEditConfirmOpen}
        type="confirm"
        title="Xác nhận cập nhật"
        message="Bạn có chắc chắn muốn lưu những thay đổi này không?"
        confirmText="Lưu thay đổi"
        cancelText="Hủy"
        isLoading={isSubmitting}
        onClose={() => {
          if (isSubmitting) return;
          setIsEditConfirmOpen(false);
          setPendingEditPayload(null);
        }}
        onConfirm={handleConfirmEdit}
      />

      <ToastModal
        isOpen={Boolean(submitError)}
        type="error"
        title="Lỗi khi lưu"
        message={submitError || ''}
        onClose={() => setSubmitError(null)}
      />
      </div>
    </div>
  );
};
