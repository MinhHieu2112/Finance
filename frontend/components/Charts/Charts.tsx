import React, { useMemo } from 'react';
import type { ChartsProps } from './types';
import { TransactionType } from './types';
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

const parseTransactionDate = (dateValue: string) => {
  if (!dateValue) {
    return null;
  }

  const normalized = dateValue.trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00`)
    : new Date(normalized);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  const categoryData = useMemo(() => {
    const expenses   = transactions.filter((t) => t.type === TransactionType.EXPENSE);
    const map        = new Map<string, number>();

    expenses.forEach((t) => {
      t.details.forEach((detail) => {
        const current = map.get(detail.categoryName) || 0;
        map.set(detail.categoryName, current + detail.amount);
      });
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

  const topCategoryLegend = useMemo(() => categoryData.slice(0, 3), [categoryData]);

  const timelineData = useMemo(() => {
    if (transactions.length === 0) {
      return [];
    }

    const parsedTransactions = transactions
      .map((transaction) => ({
        ...transaction,
        parsedDate: parseTransactionDate(transaction.date),
      }))
      .filter((transaction): transaction is typeof transaction & { parsedDate: Date } => Boolean(transaction.parsedDate));

    if (!parsedTransactions.length) {
      return [];
    }

    const maxTime = Math.max(...parsedTransactions.map((transaction) => transaction.parsedDate.getTime()));
    const endDate = new Date(maxTime);
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    startDate.setDate(endDate.getDate() - 30);
    startDate.setHours(0, 0, 0, 0);

    const groupedDailyNet = new Map<string, number>();

    parsedTransactions.forEach((transaction) => {
      const transactionDate = transaction.parsedDate;

      const signedAmount = transaction.type === TransactionType.INCOME
        ? transaction.total_amount
        : -transaction.total_amount;

      if (transactionDate < startDate) {
        return;
      }

      if (transactionDate > endDate) {
        return;
      }

      const dateKey = formatDateKey(transactionDate);
      const currentValue = groupedDailyNet.get(dateKey) || 0;
      groupedDailyNet.set(dateKey, currentValue + signedAmount);
    });

    const result: Array<{ date: string; label: string; balance: number }> = [];
    const cursor = new Date(startDate);
    let runningBalance = 0;

    while (cursor <= endDate) {
      const dateKey = formatDateKey(cursor);
      const dailyNet = groupedDailyNet.get(dateKey) || 0;
      runningBalance += dailyNet;

      result.push({
        date: dateKey,
        label: formatShortDate(cursor),
        balance: runningBalance,
      });

      cursor.setDate(cursor.getDate() + 1);
    }

    return result;
  }, [transactions]);

  const formatTooltipMoney = (value: unknown) => `${Math.round(Number(value ?? 0)).toLocaleString('en-US')} VND`;

  if (transactions.length === 0) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Expense Breakdown</h3>
        <div className="h-56 flex items-center gap-4">
          <div className="flex-1 min-w-0 h-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={54} outerRadius={82} paddingAngle={4} dataKey="value">
                  {categoryData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <ReTooltip formatter={formatTooltipMoney} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="w-40 shrink-0 space-y-2">
            {topCategoryLegend.map((item) => (
              <div key={item.name} className="flex items-center gap-2 min-w-0">
                <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-sm text-gray-700">{item.name}</span>
              </div>
            ))}

            {!topCategoryLegend.length && (
              <p className="text-xs text-gray-500">No expense data available.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Money Flow</h3>

        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 12 }} minTickGap={18} />
              <YAxis tick={{ fontSize: 12 }} />
              <ReTooltip
                formatter={formatTooltipMoney}
                labelFormatter={(_, payload) => {
                  const dateLabel = payload?.[0]?.payload?.date;
                  return dateLabel || '';
                }}
              />
              <Line
                type="monotone"
                dataKey="balance"
                name="Balance"
                stroke="#2563EB"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {!timelineData.length && (
          <p className="text-xs text-gray-500 mt-3">No transactions found</p>
        )}
      </div>
    </div>
  );
};
