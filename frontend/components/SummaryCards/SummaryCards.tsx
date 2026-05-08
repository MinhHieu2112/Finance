import React, { useMemo } from 'react';
import type { SummaryCardsProps } from './types';
import { TransactionType } from './types';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/currencies';
import { Currency } from '../../types/Transactions';

export const SummaryCards: React.FC<SummaryCardsProps> = ({ transactions }) => {
  const { income, expense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      const amount = t.base_amount || t.total_amount; // Fallback for old records
      if (t.type === TransactionType.INCOME) income += amount;
      else expense += amount;
    });

    return { income, expense, balance: income - expense };
  }, [transactions]);

  const Card = ({ title, amount, icon, colorClass }: { title: string; amount: number; icon: React.ReactNode; colorClass: string }) => (
    <div className="bg-white dark:bg-[#1a1c26] rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-[#2a2d3d] flex flex-col gap-4 relative overflow-hidden group transition-all hover:shadow-md hover:border-indigo-100 dark:hover:border-indigo-500/30">
      {/* Background decoration */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-5 group-hover:scale-110 transition-transform ${colorClass.replace('text', 'bg')}`}></div>
      
      <div className="flex items-center justify-between relative z-10">
        <div className={`p-2.5 rounded-xl ${colorClass.replace('text', 'bg').replace('600', '100').replace('500', '100')} dark:bg-opacity-10`}>
          {icon}
        </div>
      </div>

      <div className="relative z-10">
        <p className="text-xs text-gray-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className={`text-2xl font-black ${colorClass} tracking-tight`}>
          {formatCurrency(amount, Currency.VND)}
        </h3>
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card title = "Tổng số dư" amount = {balance} icon = {<Wallet className="text-indigo-600 w-6 h-6" />} colorClass="text-indigo-600" />
      <Card title = "Tổng thu nhập" amount = {income}  icon = {<ArrowUpCircle className="text-emerald-600 w-6 h-6" />} colorClass="text-emerald-600" />
      <Card title = "Tổng chi tiêu" amount = {expense} icon = {<ArrowDownCircle className="text-red-500 w-6 h-6" />} colorClass="text-red-500" />
    </div>
  );
};
