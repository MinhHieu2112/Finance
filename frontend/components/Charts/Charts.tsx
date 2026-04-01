import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../../types/Transactions';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

interface ChartsProps {
  transactions: Transaction[];
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];

const formatDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatShortDate = (date: Date) => {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const formatStatMoney = (value: number) => {
  if (!Number.isFinite(value)) {
    return '0';
  }

  const integerValue = Math.trunc(value);
  return integerValue.toLocaleString('vi-VN');
};

export const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  const [visibleSeries, setVisibleSeries] = useState({ income: true, expense: true });

  const categoryData = useMemo(() => {
    const expenses   = transactions.filter((t) => t.type === TransactionType.EXPENSE);
    const map        = new Map<string, number>();

    expenses.forEach((t) => {
      const current = map.get(t.category) || 0;
      map.set(t.category, current + t.amount);
    });

    const rows = Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const total = rows.reduce((sum, row) => sum + row.value, 0);

    return rows.map((row, index) => ({
      ...row,
      percentage: total > 0 ? (row.value / total) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [transactions]);

  const timelineData = useMemo(() => {
    if (transactions.length === 0) {
      return [];
    }

    const toDate = (dateValue: string) => new Date(`${dateValue}T00:00:00`);

    const maxTime = Math.max(...transactions.map((t) => toDate(t.date).getTime()));
    const endDate = new Date(maxTime);
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
    startDate.setHours(0, 0, 0, 0);

    const grouped = new Map<string, { income: number; expense: number }>();

    transactions.forEach((t) => {
      const transactionDate = toDate(t.date);

      if (transactionDate < startDate || transactionDate > endDate) {
        return;
      }

      const dateKey = formatDateKey(transactionDate);

      if (!grouped.has(dateKey)) {
        grouped.set(dateKey, { income: 0, expense: 0 });
      }

      const entry = grouped.get(dateKey)!;

      if (t.type === TransactionType.INCOME) entry.income += t.amount;
      else entry.expense += t.amount;
    });

    const result: Array<{ date: string; label: string; income: number; expense: number }> = [];
    const cursor = new Date(startDate);

    while (cursor <= endDate) {
      const dateKey = formatDateKey(cursor);
      const daily = grouped.get(dateKey) || { income: 0, expense: 0 };

      result.push({
        date: dateKey,
        label: formatShortDate(cursor),
        income: daily.income,
        expense: daily.expense,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [transactions]);


  const lineStats = useMemo(() => {
    if (!timelineData.length) {
      return {
        averageIncome: 0,
        averageExpense: 0,
        maxIncome: 0,
        maxExpense: 0,
      };
    }

    const days = timelineData.length;
    const totalIncome = timelineData.reduce((sum, item) => sum + item.income, 0);
    const totalExpenseValue = timelineData.reduce((sum, item) => sum + item.expense, 0);
    const maxIncome = timelineData.reduce((max, item) => Math.max(max, item.income), 0);
    const maxExpense = timelineData.reduce((max, item) => Math.max(max, item.expense), 0);

    return {
      averageIncome: totalIncome / days,
      averageExpense: totalExpenseValue / days,
      maxIncome,
      maxExpense,
    };
  }, [timelineData]);

  const toggleSeries = (series: 'income' | 'expense') => {
    setVisibleSeries((prev) => ({
      ...prev,
      [series]: !prev[series],
    }));
  };

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Phân bổ chi tiêu</h3>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={categoryData} cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={4} dataKey="value">
                {categoryData.map((entry) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <ReTooltip formatter={(value: number) => `${value.toLocaleString('vi-VN')} đ`} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 overflow-x-auto">
          <div className="min-w-[440px] text-sm">
            <div className="grid grid-cols-[minmax(0,1fr)_90px_140px] text-xs font-semibold uppercase text-gray-500 pb-2">
              <span>Danh mục</span>
              <span className="text-right">Tỷ lệ</span>
              <span className="text-right">Tổng tiền</span>
            </div>

            {categoryData.map((item) => (
              <div
                key={item.name}
                className="grid grid-cols-[minmax(0,1fr)_90px_140px] items-center py-2 border-t border-gray-100"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-gray-700">{item.name}</span>
                </div>
                <span className="text-right text-gray-700">{item.percentage.toFixed(1)}%</span>
                <span className="text-right font-medium text-gray-800">{item.value.toLocaleString('vi-VN')} đ</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Dòng tiền (1 tháng gần nhất)</h3>

        <div className="flex items-center gap-3 mb-4 text-sm">
          <button
            type="button"
            onClick={() => toggleSeries('income')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
              visibleSeries.income
                ? 'border-emerald-300 bg-emerald-50 text-emerald-700'
                : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            income
          </button>

          <button
            type="button"
            onClick={() => toggleSeries('expense')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
              visibleSeries.expense
                ? 'border-red-300 bg-red-50 text-red-700'
                : 'border-gray-200 bg-gray-50 text-gray-400'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            expense
          </button>
        </div>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={18} />
              <YAxis tick={{ fontSize: 12 }} />
              <ReTooltip
                formatter={(value: number) => `${value.toLocaleString('vi-VN')} đ`}
                labelFormatter={(_, payload) => {
                  const dateLabel = payload?.[0]?.payload?.date;
                  return dateLabel || '';
                }}
              />
              <Line
                type="monotone"
                dataKey="income"
                name="income"
                stroke="#10B981"
                strokeWidth={2.5}
                dot={false}
                hide={!visibleSeries.income}
              />
              <Line
                type="monotone"
                dataKey="expense"
                name="expense"
                stroke="#EF4444"
                strokeWidth={2.5}
                dot={false}
                hide={!visibleSeries.expense}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
            <p className="text-emerald-700 text-xs font-medium uppercase">Trung bình thu</p>
            <p className="text-emerald-800 font-semibold">{formatStatMoney(lineStats.averageIncome)} đ</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-red-700 text-xs font-medium uppercase">Trung bình chi</p>
            <p className="text-red-800 font-semibold">{formatStatMoney(lineStats.averageExpense)} đ</p>
          </div>
          <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2">
            <p className="text-emerald-700 text-xs font-medium uppercase">Cao nhất thu</p>
            <p className="text-emerald-800 font-semibold">{formatStatMoney(lineStats.maxIncome)} đ</p>
          </div>
          <div className="rounded-lg border border-red-100 bg-red-50 px-3 py-2">
            <p className="text-red-700 text-xs font-medium uppercase">Cao nhất chi</p>
            <p className="text-red-800 font-semibold">{formatStatMoney(lineStats.maxExpense)} đ</p>
          </div>
        </div>
      </div>
    </div>
  );
};
