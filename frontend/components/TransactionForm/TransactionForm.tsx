import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../Button/Button';
import { Plus, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
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
import { Currency } from '../../types/Transactions';
import { formatCurrency } from '../../lib/currencies';
import { parseCurrencyAmountInput } from '../../lib/currencyInput';
import { api, getApiErrorMessage } from '../../lib/api';
import { ToastModal } from '../ToastModal/ToastModal';

// Tạo ID duy nhất cho từng dòng hạng mục chi tiết.
const createRowId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

// Lấy ngày hiện tại định dạng ISO (YYYY-MM-DD).
const getTodayISO = () => new Date().toISOString().split('T')[0];

// Chuyển đổi giá trị ngày sang định dạng chuẩn của input date.
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

// Tạo một hạng mục chi tiết trống mặc định.
const createEmptyDetail = (defaultCategoryId = ''): TransactionDetailInput => ({
  id: createRowId(),
  categoryId: defaultCategoryId,
  quantity: '1',
  amount: '',
  name: '',
});

// Phân tích chuỗi số tiền nhập vào thành giá trị số nguyên.
const getParsedAmount = (rawValue: string) => parseCurrencyAmountInput(rawValue).amount;

// Xây dựng danh sách hạng mục ban đầu dựa trên dữ liệu giao dịch hoặc payload có sẵn.
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
  defaultType?: string,
) => (transaction?.type || payload?.type || defaultType || TransactionType.EXPENSE) as TransactionType;

const getInitialFrequency = (
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
) => transaction?.frequency || payload?.frequency || TransactionFrequency.ONE_TIME;

const getInitialDate = (
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
) => toDateInputValue(transaction?.date || payload?.date);

const getInitialCurrency = (
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
) => transaction?.currency || payload?.currency || Currency.VND;

// Component biểu mẫu cho phép tạo mới hoặc chỉnh sửa thông tin giao dịch tài chính.
export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  onClose,
  categoryOptions,
  mode = 'create',
  initialTransaction = null,
  initialPayload = null,
  defaultType,
}) => {
  const [description, setDescription] = useState(getInitialDescription(initialTransaction, initialPayload));
  const [type, setType] = useState<TransactionType>(getInitialType(initialTransaction, initialPayload, defaultType));
  const [frequency, setFrequency] = useState<TransactionFrequency>(
    getInitialFrequency(initialTransaction, initialPayload),
  );
  const [currency, setCurrency] = useState<Currency>(getInitialCurrency(initialTransaction, initialPayload));
  const [date, setDate] = useState(getInitialDate(initialTransaction, initialPayload));
  const [details, setDetails] = useState<TransactionDetailInput[]>(
    buildInitialDetails(categoryOptions, getInitialType(initialTransaction, initialPayload, defaultType), initialTransaction, initialPayload),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isEditConfirmOpen, setIsEditConfirmOpen] = useState(false);
  const [pendingEditPayload, setPendingEditPayload] = useState<TransactionPayload | null>(null);
  const [userCurrencies, setUserCurrencies] = useState<{code: string, name: string, rateToVnd: number}[]>([]);

  // Fetch danh sách tiền tệ của người dùng
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const response = await api.get<{success: boolean, currencies: any[]}>('/currencies/list');
        if (response.data.success) {
          const list = response.data.currencies.map(c => ({ 
            code: c.code, 
            name: c.name, 
            rateToVnd: c.rateToVnd 
          }));
          // Luôn đảm bảo có VND trong danh sách nếu chưa có
          if (!list.find(c => c.code === 'VND')) {
            list.unshift({ code: 'VND', name: 'Việt Nam Đồng', rateToVnd: 1 });
          }
          setUserCurrencies(list);
        }
      } catch (error) {
        console.error('Không thể tải danh sách tiền tệ', error);
        setUserCurrencies([{ code: 'VND', name: 'Việt Nam Đồng', rateToVnd: 1 }]);
      }
    };
    fetchCurrencies();
  }, []);
  const fieldLabelClass = 'block text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1.5 ml-1';
  const detailLabelClass = 'block text-[9px] font-black uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5 ml-1';
  const fieldClass = 'h-11 w-full rounded-xl bg-gray-50 dark:bg-[#13151f] px-4 text-sm text-gray-700 dark:text-slate-200 ring-1 ring-gray-200 dark:ring-[#2a2d3d] outline-none transition-all duration-200 focus:bg-white dark:focus:bg-[#1a1c26] focus:ring-2 focus:ring-primary/40';
  
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
    const initialType = getInitialType(initialTransaction, initialPayload, defaultType);
    setDescription(getInitialDescription(initialTransaction, initialPayload));
    setType(initialType);
    setFrequency(getInitialFrequency(initialTransaction, initialPayload));
    setCurrency(getInitialCurrency(initialTransaction, initialPayload));
    setDate(getInitialDate(initialTransaction, initialPayload));
    setDetails(buildInitialDetails(categoryOptions, initialType, initialTransaction, initialPayload));
  }, [initialTransaction, initialPayload, mode, categoryOptions, defaultType]);

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

  // Cập nhật thông tin chi tiết của một dòng hạng mục cụ thể.
  const updateDetail = (detailId: string, patch: Partial<TransactionDetailInput>) => {
    setDetails((prevDetails) => prevDetails.map((detail) => (
      detail.id === detailId ? { ...detail, ...patch } : detail
    )));
  };

  // Thêm một dòng hạng mục chi tiết mới phía sau vị trí hiện tại.
  const addDetailAfter = (index: number) => {
    setDetails((prevDetails) => {
      const nextDetails = [...prevDetails];
      nextDetails.splice(index + 1, 0, createEmptyDetail(filteredCategoryOptions[0]?._id || ''));
      return nextDetails;
    });
  };

  // Xóa một dòng hạng mục chi tiết khỏi danh sách (duy trì tối thiểu 1 dòng).
  const removeDetail = (detailId: string) => {
    setDetails((prevDetails) => {
      if (prevDetails.length <= 1) {
        return prevDetails;
      }

      return prevDetails.filter((detail) => detail.id !== detailId);
    });
  };

  const totalAmountPreview = details.reduce((sum, detail) => {
    const amountValue = getParsedAmount(detail.amount);
    const quantityValue = Number.parseInt(detail.quantity, 10);
    return Number.isFinite(amountValue) && amountValue >= 0 && Number.isFinite(quantityValue) && quantityValue > 0
      ? sum + amountValue * quantityValue
      : sum;
  }, 0);

  const totalVndPreview = useMemo(() => {
    if (currency === 'VND') return totalAmountPreview;
    const rate = userCurrencies.find(c => c.code === currency)?.rateToVnd || 1;
    return totalAmountPreview * rate;
  }, [totalAmountPreview, currency, userCurrencies]);

  // Xử lý thay đổi số tiền và tự động nhận diện loại tiền tệ nếu có.
  const handleAmountChange = (detailId: string, rawValue: string) => {
    const { detectedCurrency } = parseCurrencyAmountInput(rawValue);
    updateDetail(detailId, { amount: rawValue });

    if (detectedCurrency && detectedCurrency !== currency) {
      setCurrency(detectedCurrency);
    }
  };

  // Xử lý gửi biểu mẫu, kiểm tra tính hợp lệ và chuẩn bị payload dữ liệu.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const detectedCurrencies = Array.from(new Set(
      details
        .map((detail) => parseCurrencyAmountInput(detail.amount).detectedCurrency)
        .filter((value): value is Currency => value !== null),
    ));

    if (detectedCurrencies.length > 1) {
      setSubmitError('Mỗi giao dịch chỉ hỗ trợ một loại tiền tệ. Vui lòng dùng cùng một đơn vị cho tất cả hạng mục.');
      return;
    }

    const invalidAmountExists = details.some((detail) => {
      const hasRawValue = detail.amount.trim().length > 0;
      return hasRawValue && getParsedAmount(detail.amount) === null;
    });

    if (invalidAmountExists) {
      setSubmitError('Có hạng mục có số tiền không hợp lệ. Bạn có thể nhập như `20000`, `20$` hoặc `500000đ`.');
      return;
    }

    const resolvedCurrency = detectedCurrencies[0] || currency;

    const normalizedDetails = details.map((detail) => {
      const matchedCategory = categoryOptions.find((category) => category._id === detail.categoryId);
      return {
        categoryId: detail.categoryId,
        categoryName: matchedCategory?.name || '',
        quantity: Number.parseInt(detail.quantity, 10) || 1,
        amount: getParsedAmount(detail.amount) || 0,
        name: detail.name,
      };
    });

    const payload: TransactionPayload = {
      description,
      type,
      frequency,
      currency: resolvedCurrency,
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
      setIsSubmitting(true);
      await onSave(payload);
      onClose('saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu giao dịch. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Xác nhận và thực hiện gửi dữ liệu cập nhật sau khi người dùng đồng ý.
  const handleConfirmEdit = async () => {
    if (!pendingEditPayload) {
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave(pendingEditPayload);
      setIsEditConfirmOpen(false);
      setPendingEditPayload(null);
      onClose('saved');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật giao dịch. Vui lòng thử lại.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => onClose('cancelled')}>
      <div 
        className="bg-white dark:bg-[#1a1c26] rounded-[2rem] w-full max-w-4xl relative shadow-2xl animate-fade-in-up max-h-[90vh] flex flex-col overflow-hidden border border-gray-100 dark:border-[#2a2d3d] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header - Sticky */}
        <div className="px-6 py-5 flex justify-between items-center border-b border-gray-100 dark:border-[#2a2d3d] bg-white/80 dark:bg-[#1a1c26]/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-primary dark:text-indigo-400 flex items-center justify-center">
              <Plus size={20} />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                {mode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Tạo giao dịch mới'}
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">Cập nhật thông tin tài chính của bạn</p>
            </div>
          </div>
          <button 
            onClick={() => onClose('cancelled')} 
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-[#232634] text-gray-400 dark:text-slate-500 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 custom-scrollbar bg-gray-50/30 dark:bg-transparent">
          
          {/* SECTION 1: THÔNG TIN CHUNG */}
          <div className="bg-white dark:bg-[#1a1c26] rounded-2xl border border-gray-100 dark:border-[#2a2d3d] shadow-sm p-6 mb-6">
            <div className="flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                <div className="md:col-span-12">
                  <label className={fieldLabelClass}>Phân loại giao dịch</label>
                  <div className="flex bg-gray-100 dark:bg-[#13151f] p-1.5 rounded-2xl border border-gray-200 dark:border-[#2a2d3d] shadow-inner overflow-x-auto no-scrollbar">
                    <button
                      type="button"
                      onClick={() => setType(TransactionType.EXPENSE)}
                      className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === TransactionType.EXPENSE ? 'bg-white dark:bg-[#1a1c26] shadow-lg text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/30' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Chi tiêu
                    </button>
                    <button
                      type="button"
                      onClick={() => setType(TransactionType.INCOME)}
                      className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === TransactionType.INCOME ? 'bg-white dark:bg-[#1a1c26] shadow-lg text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/30' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Thu nhập
                    </button>
                    <button
                      type="button"
                      onClick={() => setType(TransactionType.DEBT)}
                      className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === TransactionType.DEBT ? 'bg-white dark:bg-[#1a1c26] shadow-lg text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/30' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Khoản nợ
                    </button>
                    <button
                      type="button"
                      onClick={() => setType(TransactionType.SAVINGS)}
                      className={`flex-1 min-w-[80px] py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${type === TransactionType.SAVINGS ? 'bg-white dark:bg-[#1a1c26] shadow-lg text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                      Tiết kiệm
                    </button>
                  </div>
                </div>

                <div className="md:col-span-12">
                  <label className={fieldLabelClass}>Mô tả chính</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className={fieldClass}
                    placeholder="Ví dụ: Shopping cuối tuần, Lương tháng..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2 border-t border-gray-50 dark:border-[#2a2d3d]">
                <div>
                  <label className={fieldLabelClass}>Ngày giao dịch</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={fieldClass}
                  />
                </div>

                <div>
                  <label className={fieldLabelClass}>Tần suất định kỳ</label>
                  <select
                    value={frequency}
                    onChange={(e) => setFrequency(e.target.value as TransactionFrequency)}
                    className={fieldClass}
                  >
                    <option value={TransactionFrequency.ONE_TIME}>Một lần</option>
                    <option value={TransactionFrequency.WEEKLY}>Hàng tuần</option>
                    <option value={TransactionFrequency.MONTHLY}>Hàng tháng</option>
                    <option value={TransactionFrequency.YEARLY}>Hàng năm</option>
                  </select>
                </div>

                <div>
                  <label className={fieldLabelClass}>Đơn vị tiền tệ chính</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                    className={fieldClass}
                  >
                    {userCurrencies.map((curr) => (
                      <option key={curr.code} value={curr.code}>
                        {curr.code} - {curr.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: CHI TIẾT GIAO DỊCH */}
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Hạng mục chi tiết</h3>
              <span className="text-[9px] font-black px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-primary dark:text-indigo-400 rounded-full uppercase tracking-wider border border-indigo-100 dark:border-indigo-900/30">
                {details.length} Hạng mục
              </span>
            </div>

            <div className="space-y-3">
              {details.map((detail, index) => (
                <div key={detail.id} className="group relative grid grid-cols-1 gap-4 rounded-2xl border border-gray-100 dark:border-[#2a2d3d] bg-white dark:bg-[#1a1c26] p-4 transition-all duration-300 hover:border-indigo-200 dark:hover:border-primary/30 hover:shadow-lg xl:grid-cols-[minmax(0,2.2fr)_90px_150px_minmax(0,2fr)_auto] xl:items-end">
                  <div>
                    <label className={detailLabelClass}>Danh mục</label>
                    <select
                      value={detail.categoryId}
                      onChange={(e) => updateDetail(detail.id, { categoryId: e.target.value })}
                      className={fieldClass}
                    >
                      {groupedCategoryOptions.map((group) => (
                        <optgroup key={group.catalogName} label={group.catalogName}>
                          {group.options.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className={detailLabelClass}>Số lượng</label>
                    <input
                      type="number"
                      value={detail.quantity}
                      onChange={(e) => updateDetail(detail.id, { quantity: e.target.value })}
                      className={`${fieldClass} text-center font-bold`}
                    />
                  </div>

                  <div>
                    <label className={detailLabelClass}>Đơn giá ({currency})</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={detail.amount}
                      onChange={(e) => handleAmountChange(detail.id, e.target.value)}
                      className={`${fieldClass} text-right font-black ${
                        type === TransactionType.INCOME ? 'text-emerald-600 dark:text-emerald-400' :
                        type === TransactionType.EXPENSE ? 'text-red-600 dark:text-red-400' :
                        type === TransactionType.DEBT ? 'text-amber-600 dark:text-amber-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}
                      placeholder={`Ví dụ: 20`}
                    />
                  </div>

                  <div>
                    <label className={detailLabelClass}>Ghi chú hạng mục</label>
                    <input
                      type="text"
                      value={detail.name}
                      onChange={(e) => updateDetail(detail.id, { name: e.target.value })}
                      className={fieldClass}
                      placeholder="..."
                    />
                  </div>

                  <div className="flex items-end gap-2 xl:justify-end">
                    <button
                      type="button"
                      onClick={() => addDetailAfter(index)}
                      className="flex h-11 w-11 items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-primary dark:text-indigo-400 transition-all hover:scale-105 active:scale-95 shadow-sm"
                    >
                      <Plus size={18} />
                    </button>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDetail(detail.id)}
                        className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 transition-all hover:scale-105 active:scale-95 shadow-sm"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer - Sticky */}
        <div className="px-8 py-6 bg-white dark:bg-[#1a1c26] border-t border-gray-100 dark:border-[#2a2d3d] flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_-10px_30px_rgba(0,0,0,0.03)]">
          <div className="flex items-center gap-4">
            <div className="px-5 py-3 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100/50 dark:border-indigo-900/20">
              <div className="text-[9px] font-black text-indigo-400 dark:text-primary uppercase tracking-widest mb-0.5">Tổng dự tính</div>
              {currency !== 'VND' && (
                <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 mt-0.5 border-t border-indigo-100 dark:border-indigo-900/20 pt-0.5">
                  {formatCurrency(totalVndPreview, 'VND')}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button
              type="button"
              onClick={() => onClose('cancelled')}
              className="flex-1 md:flex-none px-6 py-2 text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest hover:text-slate-900 dark:hover:text-slate-200 transition-colors"
            >
              Hủy bỏ
            </button>
            <Button
              type="submit"
              onClick={handleSubmit}
              isLoading={isSubmitting}
              className="flex-[2] md:flex-none px-8 py-3 bg-primary hover:bg-indigo-700 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
            >
              {mode === 'edit' ? 'Cập nhật' : 'Lưu giao dịch'}
            </Button>
          </div>
        </div>

        {/* RE-INSERTED MODALS */}
        <ToastModal
          isOpen={isEditConfirmOpen}
          type="confirm"
          title="Xác nhận thay đổi"
          message="Bạn có chắc chắn muốn cập nhật thông tin giao dịch này không?"
          confirmText="Xác nhận"
          cancelText="Hủy"
          isLoading={isSubmitting}
          onClose={() => {
            if (isSubmitting) return;
            setIsEditConfirmOpen(false);
            setPendingEditPayload(null);
          }}
          onConfirm={handleConfirmEdit}
        />
      </div>
    </div>
  );
};

export default TransactionForm;
