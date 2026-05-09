import React, { useMemo, useState } from 'react';
import { formatCurrency } from '../../lib/currencies';
import { Currency } from '../../types/Transactions';
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
  Legend,
} from 'recharts';
import { X } from 'lucide-react';

const COLORS = ['#818cf8', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#0ea5e9'];

type Period = 'week' | 'month' | 'year' | 'custom';

const PERIODS: { label: string; value: Period }[] = [
  { label: 'Tuần này',  value: 'week'  },
  { label: 'Tháng này', value: 'month' },
  { label: 'Năm nay',   value: 'year'  },
  { label: 'Tùy chỉnh', value: 'custom' },
];

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

  const [period, setPeriod] = useState<Period>('month');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [chartType, setChartType] = useState<TransactionType>(TransactionType.EXPENSE);

  // Lọc giao dịch dựa trên giai đoạn đã chọn
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);

    if (period === 'custom') {
      const cStart = customStartDate ? new Date(customStartDate) : null;
      const cEnd = customEndDate ? new Date(customEndDate) : null;
      if (cStart) cStart.setHours(0, 0, 0, 0);
      if (cEnd) cEnd.setHours(23, 59, 59, 999);

      return transactions.filter((t) => {
        const d = parseTransactionDate(t.date);
        if (!d) return false;
        if (cStart && d < cStart) return false;
        if (cEnd && d > cEnd) return false;
        return true;
      });
    }

    if (period === 'week') {
      // Đầu tuần này (Giả định Thứ 2 là đầu tuần)
      const day = start.getDay();
      const diff = start.getDate() - day + (day === 0 ? -6 : 1); 
      start.setDate(diff);
    } else if (period === 'month') {
      // Đầu tháng này
      start.setDate(1);
    } else if (period === 'year') {
      // Đầu năm nay
      start.setMonth(0, 1);
    }

    return transactions.filter((t) => {
      const d = parseTransactionDate(t.date);
      return d !== null && d >= start;
    });
  }, [transactions, period, customStartDate, customEndDate]);

  // Dữ liệu cho biểu đồ tròn (Cơ cấu)
  const categoryData = useMemo(() => {
    const items = filteredTransactions.filter((t) => t.type === chartType);
    const map      = new Map<string, number>();
    items.forEach((t) => {
      t.details.forEach((detail) => {
        const amount = detail.base_amount || detail.amount;
        map.set(detail.categoryName, (map.get(detail.categoryName) || 0) + (amount * (detail.quantity || 1)));
      });
    });
    const rows  = Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    return rows.map((row, index) => ({
      ...row,
      percentage: total > 0 ? (row.value / total) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [filteredTransactions, chartType]);

  const topCategoryLegend = useMemo(() => categoryData.slice(0, 5), [categoryData]);

  // Dữ liệu cho biểu đồ đường (Dòng tiền)
  const timelineData = useMemo(() => {
    if (filteredTransactions.length === 0) return [];

    const parsedTransactions = filteredTransactions
      .map((t) => ({ ...t, parsedDate: parseTransactionDate(t.date) }))
      .filter((t): t is typeof t & { parsedDate: Date } => Boolean(t.parsedDate));

    if (!parsedTransactions.length) return [];

    // Tìm khoảng thời gian để vẽ trục X
    const dates = parsedTransactions.map(t => t.parsedDate.getTime());
    const minTime = Math.min(...dates);
    const maxTime = Math.max(...dates);
    
    const startDate = new Date(minTime);
    const endDate = new Date(maxTime);
    
    // Gom dữ liệu theo ngày
    const groupedDailyIncome = new Map<string, number>();
    const groupedDailyExpense = new Map<string, number>();
    const groupedDailyDebt = new Map<string, number>();
    const groupedDailySavings = new Map<string, number>();

    parsedTransactions.forEach((t) => {
      const key = formatDateKey(t.parsedDate);
      const amount = t.base_amount || t.total_amount;
      if (t.type === TransactionType.INCOME) {
        groupedDailyIncome.set(key, (groupedDailyIncome.get(key) || 0) + amount);
      } else if (t.type === TransactionType.EXPENSE) {
        groupedDailyExpense.set(key, (groupedDailyExpense.get(key) || 0) + amount);
      } else if (t.type === TransactionType.DEBT) {
        groupedDailyDebt.set(key, (groupedDailyDebt.get(key) || 0) + amount);
      } else if (t.type === TransactionType.SAVINGS) {
        groupedDailySavings.set(key, (groupedDailySavings.get(key) || 0) + amount);
      }
    });

    // Tính số dư ban đầu (trước ngày bắt đầu của filter)
    const initialBalance = transactions.reduce((acc, t) => {
      const d = parseTransactionDate(t.date);
      if (d && d < startDate) {
        const amount = t.base_amount || t.total_amount;
        if (t.type === TransactionType.INCOME || t.type === TransactionType.DEBT) {
          return acc + amount;
        } else {
          return acc - amount;
        }
      }
      return acc;
    }, 0);

    const result: Array<{ date: string; label: string; income: number; expense: number; debt: number; savings: number; balance: number }> = [];
    const cursor = new Date(startDate);
    let runningBalance = initialBalance;

    while (cursor <= endDate) {
      const dateKey = formatDateKey(cursor);
      const income = groupedDailyIncome.get(dateKey) || 0;
      const expense = groupedDailyExpense.get(dateKey) || 0;
      const debt = groupedDailyDebt.get(dateKey) || 0;
      const savings = groupedDailySavings.get(dateKey) || 0;
      
      runningBalance += (income + debt) - (expense + savings);
      result.push({ 
        date: dateKey, 
        label: formatShortDate(cursor), 
        income, 
        expense, 
        debt,
        savings,
        balance: runningBalance 
      });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [transactions, filteredTransactions]);

  const formatTooltipMoney = (value: unknown) =>
    formatCurrency(Number(value ?? 0), Currency.VND);

  if (transactions.length === 0) return null;

  return (
    <div className="mb-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-gray-100 dark:bg-slate-700/50 p-1 rounded-xl shadow-sm w-fit">
          {PERIODS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setPeriod(value)}
              className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${
                period === value
                  ? 'bg-white dark:bg-slate-700 text-primary dark:text-indigo-400 shadow-md'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {period === 'custom' && (
          <div className="flex items-center gap-3 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-2 py-1 text-[10px] font-bold text-gray-700 dark:text-slate-300 bg-transparent focus:outline-none"
              />
              <span className="text-gray-300">→</span>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-2 py-1 text-[10px] font-bold text-gray-700 dark:text-slate-300 bg-transparent focus:outline-none"
              />
            </div>
            {(customStartDate || customEndDate) && (
              <button
                onClick={() => { setCustomStartDate(''); setCustomEndDate(''); }}
                className="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white dark:bg-[#1a1c26] p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-[#2a2d3d] transition-colors h-[480px] flex flex-col">
          <div className="flex items-center justify-between mb-8 h-9">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
              {chartType === TransactionType.EXPENSE && 'Cơ cấu chi tiêu'}
              {chartType === TransactionType.INCOME && 'Cơ cấu thu nhập'}
              {chartType === TransactionType.DEBT && 'Cơ cấu khoản nợ'}
              {chartType === TransactionType.SAVINGS && 'Cơ cấu tiết kiệm'}
            </p>
            <div className="flex bg-slate-50 dark:bg-[#13151f] p-1 rounded-xl border border-slate-100 dark:border-[#2a2d3d] overflow-x-auto no-scrollbar">
               <button 
                 onClick={() => setChartType(TransactionType.EXPENSE)}
                 className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === TransactionType.EXPENSE ? 'bg-white dark:bg-[#1a1c26] text-red-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Chi tiêu
               </button>
               <button 
                 onClick={() => setChartType(TransactionType.INCOME)}
                 className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === TransactionType.INCOME ? 'bg-white dark:bg-[#1a1c26] text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Thu nhập
               </button>
               <button 
                 onClick={() => setChartType(TransactionType.DEBT)}
                 className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === TransactionType.DEBT ? 'bg-white dark:bg-[#1a1c26] text-amber-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Khoản nợ
               </button>
               <button 
                 onClick={() => setChartType(TransactionType.SAVINGS)}
                 className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${chartType === TransactionType.SAVINGS ? 'bg-white dark:bg-[#1a1c26] text-blue-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
               >
                 Tiết kiệm
               </button>
            </div>
          </div>
          <div className="flex-1 flex flex-col md:flex-row items-center gap-6">
            <div className="flex-1 w-full h-full min-h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" stroke="none">
                    {categoryData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <ReTooltip 
                    formatter={formatTooltipMoney} 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#1a1c26' : '#fff', 
                      border: isDark ? '1px solid #2a2d3d' : '1px solid #f1f5f9',
                      borderRadius: '1rem', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' 
                    }} 
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="w-full md:w-40 space-y-2">
              {topCategoryLegend.map((item) => (
                <div key={item.name} className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate text-[10px] font-bold text-gray-600 dark:text-slate-300 uppercase">{item.name}</span>
                  <span className="ml-auto text-[10px] font-black text-slate-400">{item.percentage.toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="bg-white dark:bg-[#1a1c26] p-8 rounded-[2rem] shadow-sm border border-gray-100 dark:border-[#2a2d3d] transition-colors h-[480px] flex flex-col">
          <div className="flex items-center mb-8 h-9">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Dòng tiền (Money Flow)</p>
          </div>
          <div className="flex-1">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 20, right: 5, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} stroke={gridColor} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: tickColor }} minTickGap={20} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: tickColor }} width={60} axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <ReTooltip
                    formatter={formatTooltipMoney}
                    contentStyle={{
                      backgroundColor: isDark ? '#1a1c26' : '#fff',
                      border: isDark ? '1px solid #2a2d3d' : '1px solid #f1f5f9',
                      borderRadius: '1rem',
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      color: isDark ? '#e2e8f0' : '#374151',
                    }}
                  />
                  <Legend 
                    verticalAlign="top" 
                    align="right" 
                    height={48} 
                    iconType="circle" 
                    wrapperStyle={{ fontSize: '11px', fontWeight: 'bold', paddingBottom: '20px' }} 
                  />
                  <Line type="monotone" dataKey="income" name="Thu nhập" stroke="#10B981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="expense" name="Chi tiêu" stroke="#EF4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="debt" name="Khoản nợ" stroke="#f59e0b" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="savings" name="Tiết kiệm" stroke="#3B82F6" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="balance" name="Số dư" stroke="#4f46e5" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <p className="text-xs text-gray-400 dark:text-slate-500 italic">Không có dữ liệu trong khoảng thời gian này.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
