import React, { useEffect, useState } from 'react';
import { type CategoryOption } from '../../types/Categories';
import {
  Transaction,
  TransactionFrequency,
  TransactionType,
  type TransactionPayload,
} from '../../types/Transactions';
import { Button } from '../Button/Button';
import { Plus, Trash2, X } from 'lucide-react';

interface TransactionFormProps {
  onSave: (transaction: TransactionPayload) => Promise<void> | void;
  onClose: () => void;
  categoryOptions: CategoryOption[];
  onManageCategories?: () => void;
  mode?: 'create' | 'edit';
  initialTransaction?: Transaction | null;
  initialPayload?: TransactionPayload | null;
}

interface TransactionDetailInput {
  id: string;
  categoryId: string;
  quantity: string;
  amount: string;
  name: string;
}

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
  transaction?: Transaction | null,
  payload?: TransactionPayload | null,
): TransactionDetailInput[] => {
  if (transaction?.details?.length) {
    return transaction.details.map((detail) => ({
      id: createRowId(),
      categoryId: detail.categoryId || categoryOptions[0]?._id || '',
      quantity: String(detail.quantity ?? 1),
      amount: String(detail.amount ?? 0),
      name: detail.name || '',
    }));
  }

  if (payload?.details?.length) {
    return payload.details.map((detail) => ({
      id: createRowId(),
      categoryId: detail.categoryId || categoryOptions[0]?._id || '',
      quantity: String(detail.quantity ?? 1),
      amount: String(detail.amount ?? 0),
      name: detail.name || '',
    }));
  }

  return [createEmptyDetail(categoryOptions[0]?._id || '')];
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
    buildInitialDetails(categoryOptions, initialTransaction, initialPayload),
  );
  const [formError, setFormError] = useState('');

  useEffect(() => {
    setDescription(getInitialDescription(initialTransaction, initialPayload));
    setType(getInitialType(initialTransaction, initialPayload));
    setFrequency(getInitialFrequency(initialTransaction, initialPayload));
    setDate(getInitialDate(initialTransaction, initialPayload));
    setDetails(buildInitialDetails(categoryOptions, initialTransaction, initialPayload));
    setFormError('');
  }, [initialTransaction, initialPayload, mode, categoryOptions]);

  useEffect(() => {
    if (!categoryOptions.length) {
      return;
    }

    setDetails((prevDetails) => prevDetails.map((detail) => {
      if (detail.categoryId && categoryOptions.some((category) => category._id === detail.categoryId)) {
        return detail;
      }

      return {
        ...detail,
        categoryId: categoryOptions[0]._id,
      };
    }));
  }, [categoryOptions]);

  const updateDetail = (detailId: string, patch: Partial<TransactionDetailInput>) => {
    setDetails((prevDetails) => prevDetails.map((detail) => (
      detail.id === detailId ? { ...detail, ...patch } : detail
    )));

    if (formError) {
      setFormError('');
    }
  };

  const addDetailAfter = (index: number) => {
    setDetails((prevDetails) => {
      const nextDetails = [...prevDetails];
      nextDetails.splice(index + 1, 0, createEmptyDetail(categoryOptions[0]?._id || ''));
      return nextDetails;
    });

    if (formError) {
      setFormError('');
    }
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

    const trimmedDescription = description.trim();
    if (!trimmedDescription) {
      setFormError('Description is required.');
      return;
    }

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

    await onSave({
      description: trimmedDescription,
      type,
      frequency,
      date,
      total_amount: normalizedDetails.reduce((sum, detail) => sum + (detail.amount * detail.quantity), 0),
      details: normalizedDetails,
    });

    onClose();
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
              </div>

              <div className="xl:col-span-3">
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    if (formError) {
                      setFormError('');
                    }
                  }}
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
                        disabled={categoryOptions.length === 0}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                      >
                        {categoryOptions.length === 0 && <option value="">No categories available</option>}
                        {categoryOptions.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
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

          {formError && (
            <p className="text-sm text-red-500">{formError}</p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              className="w-full py-3"
              disabled={categoryOptions.length === 0}
            >
              {mode === 'edit' ? 'Update Transaction' : 'Save Transaction'}
            </Button>
            {categoryOptions.length === 0 && (
              <p className="mt-2 text-xs text-red-500 text-center">
                Please create at least one category before adding transactions.
              </p>
            )}
            {categoryOptions.length === 0 && onManageCategories && (
              <div className="mt-2 text-center">
                <button
                  type="button"
                  onClick={onManageCategories}
                  className="text-xs text-primary hover:underline"
                >
                  Open Category Manager
                </button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
