import React, { useEffect, useState } from 'react';
import { Transaction, TransactionFrequency, TransactionType } from '../../types/Transactions';
import { Button } from '../Button/Button';
import { X } from 'lucide-react';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>) => Promise<void> | void;
  onClose: () => void;
  categoryOptions: string[];
  mode?: 'create' | 'edit';
  initialTransaction?: Transaction | null;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  onClose,
  categoryOptions,
  mode = 'create',
  initialTransaction = null,
}) => {
  const [description, setDescription] = useState(initialTransaction?.description || '');
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : '');
  const [type, setType] = useState<TransactionType>(initialTransaction?.type || TransactionType.EXPENSE);
  const [source, setSource] = useState(
    initialTransaction?.type === TransactionType.INCOME ? initialTransaction.category : ''
  );
  const [expenseCategory, setExpenseCategory] = useState(
    initialTransaction?.type === TransactionType.EXPENSE
      ? initialTransaction.category
      : categoryOptions[0] || ''
  );
  const [frequency, setFrequency] = useState<TransactionFrequency>(
    initialTransaction?.frequency || TransactionFrequency.ONE_TIME
  );
  const [date, setDate] = useState(initialTransaction?.date || new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!categoryOptions.length) {
      setExpenseCategory('');
      return;
    }

    if (!expenseCategory || !categoryOptions.includes(expenseCategory)) {
      setExpenseCategory(categoryOptions[0]);
    }
  }, [categoryOptions, expenseCategory]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const transactionCategory =
      type === TransactionType.INCOME ? source.trim() : expenseCategory;

    if (!description || !amount || !transactionCategory) return;

    await onSave({
      description,
      amount: parseFloat(amount),
      type,
      category: transactionCategory,
      frequency,
      date,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-6 relative shadow-2xl animate-fade-in-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>

        <h2 className="text-xl font-bold mb-6 text-gray-800">
          {mode === 'edit' ? 'Edit Transaction' : 'Add New Transaction'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button
              type      = "button"
              onClick   = {() => setType(TransactionType.EXPENSE)}
              className = {`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}
            >
              Expense
            </button>
            <button
              type      = "button"
              onClick   = {() => setType(TransactionType.INCOME)}
              className = {`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
            >
              Income
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">
              {type === TransactionType.INCOME ? 'Income Source' : 'Category'}
            </label>

            {type === TransactionType.INCOME ? (
              <input
                type="text"
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                placeholder="Example: Salary, Client A, Dividends..."
                required
              />
            ) : (
              <>
                <select
                  value={expenseCategory}
                  onChange={(e) => setExpenseCategory(e.target.value)}
                  disabled={categoryOptions.length === 0}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
                >
                  {categoryOptions.length === 0 && (
                    <option value="">No categories available</option>
                  )}
                  {categoryOptions.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Amount</label>
            <input
              type        = "number"
              min         = "0"
              step        = "0.01"
              value       = {amount}
              onChange    = {(e) => setAmount(e.target.value)}
              className   = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder = "0"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Description</label>
            <input
              type        = "text"
              value       = {description}
              onChange    = {(e) => setDescription(e.target.value)}
              className   = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder = "Example: Lunch, Fuel, Salary..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Frequency</label>
              <select
                value     = {frequency}
                onChange  = {(e) => setFrequency(e.target.value as TransactionFrequency)}
                className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
              >
                <option value={TransactionFrequency.WEEKLY}>Weekly</option>
                <option value={TransactionFrequency.MONTHLY}>Monthly</option>
                <option value={TransactionFrequency.YEARLY}>Yearly</option>
                <option value={TransactionFrequency.ONE_TIME}>One-time</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Date</label>
              <input
                type      = "date"
                value     = {date}
                onChange  = {(e) => setDate(e.target.value)}
                className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                required
              />
            </div>
          </div>

          <div className="pt-4">
            <Button
              type="submit"
              className="w-full py-3"
              disabled={type === TransactionType.EXPENSE && categoryOptions.length === 0}
            >
              {mode === 'edit' ? 'Update Transaction' : 'Save Transaction'}
            </Button>
            {type === TransactionType.EXPENSE && categoryOptions.length === 0 && (
              <p className="mt-2 text-xs text-red-500 text-center">Please create at least one category before adding an expense.</p>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
