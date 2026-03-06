import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

export const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  const categoryData = useMemo(() => {
    const expenses = transactions.filter((t) => t.type === TransactionType.EXPENSE);
    const map = new Map<string, number>();

    expenses.forEach((t) => {
      const current = map.get(t.category) || 0;
      map.set(t.category, current + t.amount);
    });

    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [transactions]);

  const timelineData = useMemo(() => {
    const grouped = new Map<string, { income: number; expense: number }>();

    transactions.forEach((t) => {
      const date = t.date;
      if (!grouped.has(date)) grouped.set(date, { income: 0, expense: 0 });
      const entry = grouped.get(date)!;
      if (t.type === TransactionType.INCOME) entry.income += t.amount;
      else entry.expense += t.amount;
    });

    return Array.from(grouped.entries())
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-7)
      .map(([date, data]) => ({
        date,
        income: data.income,
        expense: data.expense,
      }));
  }, [transactions]);

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bổ chi tiêu</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <ReTooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')} đ`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dòng tiền (7 ngày qua)</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <ReTooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')} đ`} />
              <Legend />
              <Bar dataKey="income" name="Thu nhập" fill="#10B981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Chi tiêu" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
