import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { formatCurrency } from '../../lib/currencies';
import { Currency } from '../../types/Transactions';
import type {
  AnalysisPageProps,
  ListTransactionResponse,
  Transaction,
} from './types';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LabelList
} from 'recharts';
import { api } from '../../lib/api';
import { Debt, DebtStatus, ListDebtResponse } from '../../types/Debts';

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4']; 

type Period = 'week' | 'month' | 'year';

const DAYS_OF_WEEK = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'];

// Custom Tooltip component for Dark Mode support
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 p-3 rounded-xl shadow-xl backdrop-blur-md bg-opacity-90 dark:bg-opacity-90">
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{label}</p>
        <div className="space-y-1.5">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color || entry.fill }}></div>
              <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                {entry.name}: <span className="ml-1 text-slate-900 dark:text-white">{formatCurrency(entry.value, Currency.VND)}</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export const AnalysisPage: React.FC<AnalysisPageProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [loading, setLoading] = useState(true);

  const [summaryPeriod, setSummaryPeriod] = useState<Period>('month');
  const [debtPeriod, setDebtPeriod] = useState<Period>('month');
  const [savingsPeriod, setSavingsPeriod] = useState<Period>('month');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transRes, debtRes] = await Promise.all([
          api.get<ListTransactionResponse>('/transactions/list'),
          api.get<ListDebtResponse>('/debts/list')
        ]);
        setTransactions(transRes.data.transactions);
        setDebts(debtRes.data.debts);
      } catch (e) {
        toast.error('Lỗi tải dữ liệu báo cáo');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.token]);

  const PeriodFilter = ({ current, onChange }: { current: Period, onChange: (p: Period) => void }) => (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
        {(['week', 'month', 'year'] as Period[]).map((p) => (
            <button
                key={p}
                onClick={() => onChange(p)}
                className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${current === p ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
            >
                {p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
            </button>
        ))}
    </div>
  );

  const getTimelineData = (filterType: 'summary' | 'debt' | 'savings', currentPeriod: Period) => {
    if (currentPeriod === 'week') {
        const now = new Date();
        const day = now.getDay();
        const diffToMonday = now.getDate() - day + (day === 0 ? -6 : 1);
        const monday = new Date(now.setDate(diffToMonday));
        monday.setHours(0,0,0,0);
        
        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23,59,59,999);

        const weekData = DAYS_OF_WEEK.map((name, index) => ({
            label: name,
            income: 0,
            expense: 0,
            debt_paid: 0,
            debt_unpaid: 0,
            savings: 0,
            sortKey: index
        }));

        if (filterType === 'summary') {
            transactions.forEach(t => {
                const d = new Date(t.date);
                if (d >= monday && d <= sunday) {
                    const dayIdx = d.getDay();
                    const idx = dayIdx === 0 ? 6 : dayIdx - 1;
                    const amount = t.base_amount || t.total_amount;
                    if (t.type === 'income') weekData[idx].income += amount;
                    else if (t.type === 'expense') weekData[idx].expense += amount;
                }
            });
        } else if (filterType === 'debt') {
            debts.forEach(dObj => {
                const d = new Date(dObj.transactionId.date);
                if (d >= monday && d <= sunday) {
                    const dayIdx = d.getDay();
                    const idx = dayIdx === 0 ? 6 : dayIdx - 1;
                    if (dObj.status === DebtStatus.PAID) weekData[idx].debt_paid += dObj.amount;
                    else weekData[idx].debt_unpaid += dObj.amount;
                }
            });
        } else if (filterType === 'savings') {
            transactions.filter(t => t.type === 'savings').forEach(t => {
                const d = new Date(t.date);
                if (d >= monday && d <= sunday) {
                    const dayIdx = d.getDay();
                    const idx = dayIdx === 0 ? 6 : dayIdx - 1;
                    weekData[idx].savings += (t.base_amount || t.total_amount);
                }
            });
        }
        return weekData;
    }

    const map = new Map<string, any>();
    const processItem = (dateStr: string, type: string, amount: number, status?: DebtStatus) => {
        const d = new Date(dateStr);
        let key = '';
        let label = '';
        let sortKey = 0;

        if (currentPeriod === 'year') {
            key = `${d.getFullYear()}`;
            label = `${d.getFullYear()}`;
            sortKey = d.getFullYear();
        } else {
            const month = d.getMonth() + 1;
            const year = d.getFullYear();
            key = `${year}-${month}`;
            label = `${month}/${year}`;
            sortKey = year * 100 + month;
        }

        const current = map.get(key) || { label, income: 0, expense: 0, debt_paid: 0, debt_unpaid: 0, savings: 0, sortKey };
        
        if (filterType === 'summary') {
            if (type === 'income') current.income += amount;
            else if (type === 'expense') current.expense += amount;
        } else if (filterType === 'debt' && type === 'debt') {
            if (status === DebtStatus.PAID) current.debt_paid += amount;
            else current.debt_unpaid += amount;
        } else if (filterType === 'savings' && type === 'savings') {
            current.savings += amount;
        }
        map.set(key, current);
    };

    if (filterType === 'debt') {
        debts.forEach(d => processItem(d.transactionId.date, 'debt', d.amount, d.status));
    } else {
        transactions.forEach(t => processItem(t.date, t.type, t.base_amount || t.total_amount));
    }

    return Array.from(map.values()).sort((a, b) => a.sortKey - b.sortKey);
  };

  const summaryPieData = useMemo(() => {
    let income = 0;
    let expense = 0;
    transactions.forEach(t => {
      const amount = t.base_amount || t.total_amount;
      if (t.type === 'income') income += amount;
      else if (t.type === 'expense') expense += amount;
    });
    return [
      { name: 'Thu nhập', value: income, color: COLORS[0] },
      { name: 'Chi tiêu', value: expense, color: COLORS[1] }
    ];
  }, [transactions]);

  const debtPieData = useMemo(() => {
    const paid = debts.filter(d => d.status === DebtStatus.PAID).reduce((sum, d) => sum + d.amount, 0);
    const unpaid = debts.filter(d => d.status === DebtStatus.UNPAID).reduce((sum, d) => sum + d.amount, 0);
    return [
      { name: 'Đã trả', value: paid, color: COLORS[0] },
      { name: 'Chưa trả', value: unpaid, color: COLORS[3] }
    ];
  }, [debts]);

  const savingsPieData = useMemo(() => {
    const map = new Map<string, number>();
    transactions.filter(t => t.type === 'savings').forEach(t => {
      const amount = t.base_amount || t.total_amount;
      const catName = t.details?.[0]?.categoryName || 'Khác';
      map.set(catName, (map.get(catName) || 0) + amount);
    });
    return Array.from(map.entries()).map(([name, value], index) => ({
      name,
      value,
      color: COLORS[(index + 2) % COLORS.length]
    }));
  }, [transactions]);

  const summaryTimeline = useMemo(() => getTimelineData('summary', summaryPeriod), [transactions, summaryPeriod]);
  const debtTimeline = useMemo(() => getTimelineData('debt', debtPeriod), [debts, debtPeriod]);
  const savingsTimeline = useMemo(() => getTimelineData('savings', savingsPeriod), [transactions, savingsPeriod]);

  const formatMoney = (v: number) => formatCurrency(v, Currency.VND);
  const formatShortValue = (v: any) => v > 0 ? `${(v/1000000).toFixed(1)}M` : '';

  if (loading) return (
    <div className="max-w-7xl mx-auto px-6 py-20 flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Đang trích xuất dữ liệu...</p>
    </div>
  );

  return (
    <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Báo cáo phân tích</h1>
      </div>

      {/* SECTION 1: THU CHI */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Thu nhập & Chi tiêu</h2>
            </div>
            <PeriodFilter current={summaryPeriod} onChange={setSummaryPeriod} />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 dark:text-white">
          <div className="lg:col-span-4 bg-white dark:dark:bg-[#1a1c26] p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[450px]">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 text-center">Cơ cấu tài chính</p>
            <div className="flex-1">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summaryPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                    {summaryPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-8 bg-white dark:dark:bg-[#1a1c26] p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-[450px]">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Xu hướng Thu - Chi</p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={summaryTimeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 800, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingBottom: '20px' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                <Bar dataKey="income" name="Thu nhập" fill="#10b981" radius={[4, 4, 0, 0]} barSize={summaryPeriod === 'week' ? 30 : 40}>
                    <LabelList dataKey="income" position="top" formatter={formatShortValue} style={{ fontSize: '9px', fontWeight: '900', fill: '#10b981' }} />
                </Bar>
                <Bar dataKey="expense" name="Chi tiêu" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={summaryPeriod === 'week' ? 30 : 40}>
                    <LabelList dataKey="expense" position="top" formatter={formatShortValue} style={{ fontSize: '9px', fontWeight: '900', fill: '#ef4444' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 2: KHOẢN NỢ */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Các khoản nợ</h2>
            </div>
            <PeriodFilter current={debtPeriod} onChange={setDebtPeriod} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 dark:text-white">
          <div className="lg:col-span-4 bg-white dark:bg-[#1a1c26] p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[450px]">
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 text-center">Tình trạng hoàn nợ</p>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={debtPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                      {debtPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-[#1a1c26] p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-[450px]">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Thống kê trả nợ ({debtPeriod === 'week' ? 'Tuần này' : 'Theo giai đoạn'})</p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={debtTimeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 800, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                <Legend verticalAlign="top" align="right" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                <Bar dataKey="debt_paid" name="Đã trả" fill="#10b981" radius={[4, 4, 0, 0]} barSize={debtPeriod === 'week' ? 30 : 40}>
                   <LabelList dataKey="debt_paid" position="top" formatter={formatShortValue} style={{ fontSize: '9px', fontWeight: '900', fill: '#10b981' }} />
                </Bar>
                <Bar dataKey="debt_unpaid" name="Chưa trả" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={debtPeriod === 'week' ? 30 : 40}>
                   <LabelList dataKey="debt_unpaid" position="top" formatter={formatShortValue} style={{ fontSize: '9px', fontWeight: '900', fill: '#f59e0b' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* SECTION 3: TIẾT KIỆM */}
      <section className="space-y-8">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Các khoản tiết kiệm</h2>
            </div>
            <PeriodFilter current={savingsPeriod} onChange={setSavingsPeriod} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 dark:text-white">
          <div className="lg:col-span-4 bg-white dark:bg-[#1a1c26] p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col h-[450px]">
             <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 text-center">Phân bổ tiết kiệm</p>
             <div className="flex-1">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={savingsPieData} cx="50%" cy="50%" innerRadius={65} outerRadius={95} paddingAngle={8} dataKey="value" stroke="none">
                      {savingsPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="bottom" iconType="circle" wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  </PieChart>
                </ResponsiveContainer>
             </div>
          </div>

          <div className="lg:col-span-8 bg-white dark:bg-[#1a1c26] p-8 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm h-[450px]">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6">Tăng trưởng tiết kiệm</p>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={savingsTimeline}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" opacity={0.4} />
                <XAxis dataKey="label" tick={{ fontSize: 9, fontWeight: 800, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 9, fontWeight: 700, fill: 'currentColor' }} className="text-slate-400 dark:text-slate-500" axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000000).toFixed(0)}M`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', opacity: 0.05 }} />
                <Bar dataKey="savings" name="Tiết kiệm" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={50}>
                   <LabelList dataKey="savings" position="top" formatter={formatShortValue} style={{ fontSize: '9px', fontWeight: '900', fill: '#3b82f6' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <footer className="pt-10 text-center border-t border-slate-50 dark:border-slate-800">
        <div className="inline-flex px-6 py-2 bg-slate-50 dark:bg-slate-900/50 rounded-full text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
          Smart Finance Analytical Engine v10.0
        </div>
      </footer>
    </div>
  );
};

export default AnalysisPage;
