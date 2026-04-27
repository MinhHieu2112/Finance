import React, { useMemo, useState } from 'react';
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

type Period = '7d' | '30d' | '90d' | '180d' | 'all';

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 ngày',   value: '7d'   },
  { label: '30 ngày',  value: '30d'  },
  { label: '3 tháng',  value: '90d'  },
  { label: '6 tháng',  value: '180d' },
  { label: 'Tất cả',   value: 'all'  },
];

const getPeriodDays = (period: Period): number | null => {
  if (period === 'all') return null;
  return { '7d': 7, '30d': 30, '90d': 90, '180d': 180 }[period];
};

const formatDateKey = (date: Date) => {
  const year  = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day   = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatShortDate = (date: Date) => {
  const day   = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

const parseTransactionDate = (dateValue: string) => {
  if (!dateValue) return null;
  const normalized = dateValue.trim();
  const parsed = /^\d{4}-\d{2}-\d{2}$/.test(normalized)
    ? new Date(`${normalized}T00:00:00`)
    : new Date(normalized);
  if (Number.isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const Charts: React.FC<ChartsProps> = ({ transactions }) => {
  const isDark    = document.documentElement.classList.contains('dark');
  const tickColor = isDark ? '#94a3b8' : '#6b7280';
  const gridColor = isDark ? '#334155' : '#e5e7eb';

  const [period, setPeriod] = useState<Period>('30d');

  // Filter transactions by selected period
  const filteredTransactions = useMemo(() => {
    const days = getPeriodDays(period);
    if (!days) return transactions;
    const cutoff = new Date();
    cutoff.setHours(0, 0, 0, 0);
    cutoff.setDate(cutoff.getDate() - days);
    return transactions.filter((t) => {
      const d = parseTransactionDate(t.date);
      return d !== null && d >= cutoff;
    });
  }, [transactions, period]);

  const categoryData = useMemo(() => {
    const expenses = filteredTransactions.filter((t) => t.type === TransactionType.EXPENSE);
    const map      = new Map<string, number>();
    expenses.forEach((t) => {
      t.details.forEach((detail) => {
        map.set(detail.categoryName, (map.get(detail.categoryName) || 0) + detail.amount);
      });
    });
    const rows  = Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return rows.map((row, index) => ({
      ...row,
      percentage: total > 0 ? (row.value / total) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [filteredTransactions]);

  const topCategoryLegend = useMemo(() => categoryData.slice(0, 5), [categoryData]);

  const timelineData = useMemo(() => {
    const days = getPeriodDays(period);
    if (filteredTransactions.length === 0) return [];

    const parsedTransactions = filteredTransactions
      .map((t) => ({ ...t, parsedDate: parseTransactionDate(t.date) }))
      .filter((t): t is typeof t & { parsedDate: Date } => Boolean(t.parsedDate));

    if (!parsedTransactions.length) return [];

    const maxTime = Math.max(...parsedTransactions.map((t) => t.parsedDate.getTime()));
    const endDate = new Date(maxTime);
    endDate.setHours(0, 0, 0, 0);

    const startDate = new Date(endDate);
    if (days) {
      startDate.setDate(endDate.getDate() - days);
    } else {
      const minTime = Math.min(...parsedTransactions.map((t) => t.parsedDate.getTime()));
      startDate.setTime(minTime);
    }
    startDate.setHours(0, 0, 0, 0);

    const groupedDailyNet = new Map<string, number>();
    parsedTransactions.forEach((t) => {
      if (t.parsedDate < startDate || t.parsedDate > endDate) return;
      const signed = t.type === TransactionType.INCOME ? t.total_amount : -t.total_amount;
      const key    = formatDateKey(t.parsedDate);
      groupedDailyNet.set(key, (groupedDailyNet.get(key) || 0) + signed);
    });

    const result: Array<{ date: string; label: string; balance: number }> = [];
    const cursor = new Date(startDate);
    let runningBalance = 0;
    while (cursor <= endDate) {
      const dateKey = formatDateKey(cursor);
      runningBalance += groupedDailyNet.get(dateKey) || 0;
      result.push({ date: dateKey, label: formatShortDate(cursor), balance: runningBalance });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [filteredTransactions, period]);

  const formatTooltipMoney = (value: unknown) =>
    `${Math.round(Number(value ?? 0)).toLocaleString('vi-VN')} VND`;

  if (transactions.length === 0) return null;

  return (
    <div className="mb-6">
      {/* Period Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-100">
          Biểu đồ tài chính
        </h3>
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700/50 p-1 rounded-lg">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                period === value
                  ? 'bg-white dark:bg-slate-700 text-primary dark:text-indigo-400 shadow-sm'
                  : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Donut Chart */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 transition-colors">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">Cơ cấu chi tiêu</p>
          <div className="flex items-center gap-4 h-52">
            <div className="flex-1 min-w-0 h-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={52} outerRadius={78} paddingAngle={4} dataKey="value">
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip formatter={formatTooltipMoney} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-36 shrink-0 space-y-2">
              {topCategoryLegend.length > 0 ? topCategoryLegend.map((item) => (
                <div key={item.name} className="flex items-center gap-2 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-xs text-gray-600 dark:text-slate-300">{item.name}</span>
                  <span className="ml-auto text-xs font-medium text-gray-500 dark:text-slate-400 shrink-0">{item.percentage.toFixed(1)}%</span>
                </div>
              )) : (
                <p className="text-xs text-gray-400 dark:text-slate-500">Không có dữ liệu chi tiêu trong khoảng thời gian này.</p>
              )}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700/50 transition-colors">
          <p className="text-sm font-semibold text-gray-700 dark:text-slate-200 mb-3">Dòng tiền (Money Flow)</p>
          <div className="h-56">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: tickColor }} minTickGap={24} />
                  <YAxis tick={{ fontSize: 11, fill: tickColor }} width={70}
                    tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
                  />
                  <ReTooltip
                    formatter={formatTooltipMoney}
                    labelFormatter={(_, payload) => payload?.[0]?.payload?.date || ''}
                    contentStyle={{
                      backgroundColor: isDark ? '#1e293b' : '#fff',
                      border: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
                      borderRadius: '8px',
                      color: isDark ? '#e2e8f0' : '#374151',
                    }}
                  />
                  <Line type="monotone" dataKey="balance" name="Số dư" stroke="#6366f1" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-gray-400 dark:text-slate-500">Không có dữ liệu trong khoảng thời gian này.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
