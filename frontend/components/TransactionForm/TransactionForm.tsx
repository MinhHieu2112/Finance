import React, { useState } from 'react';
import { Category, Transaction, TransactionType } from '../../types';
import { Button } from '../Button/Button';
import { X } from 'lucide-react';

interface TransactionFormProps {
  onSave: (transaction: Omit<Transaction, 'id'>) => Promise<void> | void;
  onClose: () => void;
  mode?: 'create' | 'edit';
  initialTransaction?: Transaction | null;
}

const CATEGORY_OPTIONS = Object.values(Category);

export const TransactionForm: React.FC<TransactionFormProps> = ({
  onSave,
  onClose,
  mode = 'create',
  initialTransaction = null,
}) => {
  const [description, setDescription] = useState(initialTransaction?.description || '');
  const [amount, setAmount] = useState(initialTransaction ? String(initialTransaction.amount) : '');
  const [type, setType] = useState<TransactionType>(initialTransaction?.type || TransactionType.EXPENSE);
  const [category, setCategory] = useState<Category>(initialTransaction?.category || Category.FOOD);
  const [date, setDate] = useState(initialTransaction?.date || new Date().toISOString().split('T')[0]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    await onSave({
      description,
      amount: parseFloat(amount),
      type,
      category,
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
          {mode === 'edit' ? 'Chỉnh sửa giao dịch' : 'Thêm giao dịch mới'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
            <button
              type      = "button"
              onClick   = {() => setType(TransactionType.EXPENSE)}
              className = {`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.EXPENSE ? 'bg-white text-red-500 shadow-sm' : 'text-gray-500'}`}
            >
              Chi tiêu
            </button>
            <button
              type      = "button"
              onClick   = {() => setType(TransactionType.INCOME)}
              className = {`flex-1 py-2 rounded-md text-sm font-medium transition-all ${type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
            >
              Thu nhập
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Số tiền</label>
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
            <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mô tả</label>
            <input
              type        = "text"
              value       = {description}
              onChange    = {(e) => setDescription(e.target.value)}
              className   = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
              placeholder = "Ví dụ: Ăn trưa, Tiền xăng, Lương..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Danh mục</label>
              <select
                value     = {category}
                onChange  = {(e) => setCategory(e.target.value as Category)}
                className = "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
              >
                {CATEGORY_OPTIONS.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Ngày</label>
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
            <Button type="submit" className="w-full py-3">
              {mode === 'edit' ? 'Cập nhật giao dịch' : 'Lưu giao dịch'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
