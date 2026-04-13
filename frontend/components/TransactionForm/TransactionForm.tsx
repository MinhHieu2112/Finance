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
      onClose();
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
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Unable to update transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl p-6 lg:p-8 relative shadow-2xl animate-fade-in-up max-h-[92vh] overflow-y-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-6 text-gray-800">
          {mode === 'edit' ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/40">
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-end">
              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Type</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as TransactionType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                >
                  <option value={TransactionType.EXPENSE}>Expense</option>
                  <option value={TransactionType.INCOME}>Income</option>
                </select>
                {/* {onManageCategories && (
                  <button
                    type="button"
                    onClick={() => onManageCategories(type)}
                    className="mt-2 text-xs text-indigo-600 hover:text-indigo-700 font-semibold"
                  >
                    Manage {type} categories
                  </button>
                )} */}
              </div>

              <div className="xl:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                  placeholder="Monthly expenses, Salary April..."
                />
              </div>

              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Frequency</label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as TransactionFrequency)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                >
                  <option value={TransactionFrequency.WEEKLY}>Weekly</option>
                  <option value={TransactionFrequency.MONTHLY}>Monthly</option>
                  <option value={TransactionFrequency.YEARLY}>Yearly</option>
                  <option value={TransactionFrequency.ONE_TIME}>One-time</option>
                </select>
              </div>

              <div className="xl:col-span-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                />
              </div>

              <div className="xl:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Total Preview</label>
                <div className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white text-gray-700 font-semibold">
                  {Math.round(totalAmountPreview).toLocaleString('en-US')} VND
                </div>
              </div>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Transaction Details</p>
            <div className="space-y-3">
              {details.map((detail, index) => (
                <div key={detail.id} className="rounded-xl border border-gray-200 p-4 bg-gray-50/30">
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-end">
                    <div className="xl:col-span-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Category</label>
                      <select
                        value={detail.categoryId}
                        onChange={(e) => updateDetail(detail.id, { categoryId: e.target.value })}
                        disabled={filteredCategoryOptions.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                      >
                        {filteredCategoryOptions.length === 0 && <option value="">No categories available</option>}
                        {groupedCategoryOptions.map((group) => (
                          <optgroup key={group.catalogName} label={group.catalogName}>
                            {group.options.map((category) => (
                              <option key={category._id} value={category._id}>
                                {category.name}
                              </option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                      {/* {detail.categoryId && (
                        <p className="mt-1 text-[11px] text-gray-500">
                          Catalog: {filteredCategoryOptions.find((category) => category._id === detail.categoryId)?.catalogName || '-'}
                        </p>
                      )} */}
                    </div>

                    <div className="xl:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Quantity</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        value={detail.quantity}
                        onChange={(e) => updateDetail(detail.id, { quantity: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        placeholder="1"
                      />
                    </div>

                    <div className="xl:col-span-2">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={detail.amount}
                        onChange={(e) => updateDetail(detail.id, { amount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        placeholder="0"
                      />
                    </div>

                    <div className="xl:col-span-4">
                      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Name</label>
                      <input
                        type="text"
                        value={detail.name}
                        onChange={(e) => updateDetail(detail.id, { name: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        placeholder="Detail name"
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => addDetailAfter(index)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 bg-white text-gray-700 hover:bg-gray-100"
                    >
                      <Plus size={16} />
                      Add detail
                    </button>
                    {details.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDetail(detail.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg border border-red-200 bg-white text-red-600 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              isLoading={isSubmitting}
              className="w-full py-3"
            >
              {mode === 'edit' ? 'Update Transaction' : 'Save Transaction'}
            </Button>
          </div>
        </form>

        <ToastModal
          isOpen={isEditConfirmOpen}
          type="confirm"
          title="Confirm transaction update"
          message="Do you want to save changes to this transaction?"
          confirmText="Save changes"
          cancelText="Cancel"
          isLoading={isSubmitting}
          onClose={() => {
            if (isSubmitting) {
              return;
            }
            setIsEditConfirmOpen(false);
            setPendingEditPayload(null);
          }}
          onConfirm={handleConfirmEdit}
        />

        <ToastModal
          isOpen={Boolean(submitError)}
          type="error"
          title="Transaction save failed"
          message={submitError || ''}
          onClose={() => setSubmitError(null)}
        />
      </div>
    </div>
  );
};
