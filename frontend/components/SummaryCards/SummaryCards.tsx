import React, { useMemo } from 'react';
import type { SummaryCardsProps } from './types';
import { TransactionType } from './types';
import { ArrowUpCircle, ArrowDownCircle, Wallet, PiggyBank, Coins } from 'lucide-react';
import { formatCurrency } from '../../lib/currencies';
import { Currency } from '../../types/Transactions';

export const SummaryCards: React.FC<SummaryCardsProps> = ({ transactions, debts }) => {
  // Tính toán tổng hợp các loại giao dịch và số dư (Thu nhập - Chi tiêu)
  const { income, expense, balance, debt, savings } = useMemo(() => {
    let income = 0;
    let expense = 0;
    let debtValue = 0;
    let savings = 0;

    transactions.forEach((t) => {
      const amount = t.base_amount || t.total_amount;
      if (t.type === TransactionType.INCOME) income += amount;
      else if (t.type === TransactionType.EXPENSE) expense += amount;
      else if (t.type === TransactionType.DEBT && !debts) debtValue += amount;
      else if (t.type === TransactionType.SAVINGS) savings += amount;
    });

    // Nếu có danh sách nợ chính xác từ backend, ưu tiên sử dụng để tính dư nợ thực tế
    if (debts) {
      debtValue = debts
        .filter(d => d.status === 'unpaid')
        .reduce((sum, d) => sum + d.amount, 0);
    }

    return { 
      income, 
      expense, 
      debt: debtValue,
      savings,
      balance: income - expense
    };
  }, [transactions, debts]);

  // Thành phần UI dùng chung để hiển thị từng thẻ thông số (Card)
  const Card = ({ 
    title, 
    amount, 
    icon, 
    type 
  }: { 
    title: string; 
    amount: number; 
    icon: React.ReactElement; 
    type: 'balance' | 'income' | 'expense' | 'debt' | 'savings' 
  }) => {
    
    // Bảng màu chuẩn cho từng loại thẻ
    const colorConfigs = {
      balance: {
        text: 'text-indigo-600 dark:text-indigo-400',
        bg: 'bg-indigo-50 dark:bg-indigo-900/30',
        border: 'border-indigo-100 dark:border-indigo-800/50',
        icon: 'text-indigo-600 dark:text-indigo-400',
        accent: 'bg-indigo-500'
      },
      income: {
        text: 'text-emerald-600 dark:text-emerald-400',
        bg: 'bg-emerald-50 dark:bg-emerald-900/30',
        border: 'border-emerald-100 dark:border-emerald-800/50',
        icon: 'text-emerald-600 dark:text-emerald-400',
        accent: 'bg-emerald-500'
      },
      expense: {
        text: 'text-red-600 dark:text-red-400',
        bg: 'bg-red-50 dark:bg-red-900/30',
        border: 'border-red-100 dark:border-red-800/50',
        icon: 'text-red-600 dark:text-red-400',
        accent: 'bg-red-500'
      },
      debt: {
        text: 'text-amber-600 dark:text-amber-400',
        bg: 'bg-amber-50 dark:bg-amber-900/30',
        border: 'border-amber-100 dark:border-amber-800/50',
        icon: 'text-amber-600 dark:text-amber-400',
        accent: 'bg-amber-500'
      },
      savings: {
        text: 'text-blue-600 dark:text-blue-400',
        bg: 'bg-blue-50 dark:bg-blue-900/30',
        border: 'border-blue-100 dark:border-blue-800/50',
        icon: 'text-blue-600 dark:text-blue-400',
        accent: 'bg-blue-500'
      }
    };

    const config = colorConfigs[type];
    
    return (
      <div className={`bg-white dark:bg-[#1a1c26] rounded-[2rem] p-7 shadow-sm border transition-all duration-300 relative overflow-hidden group hover:shadow-xl ${config.border} hover:border-indigo-200 dark:hover:border-indigo-700`}>
        {/* Decorative background element */}
        <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full opacity-[0.03] group-hover:scale-125 transition-transform duration-500 ${config.accent}`}></div>
        
        <div className="flex flex-col gap-5 relative z-10">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 duration-300 ${config.bg} border ${config.border}`}>
            {React.cloneElement(icon, { size: 28, className: config.icon } as any)}
          </div>
  
          <div>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] mb-1.5">{title}</p>
            <h3 className={`text-2xl font-black ${config.text} tracking-tight`}>
              {formatCurrency(amount, Currency.VND)}
            </h3>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 mb-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card title="Tổng số dư" amount={balance} icon={<Wallet />} type="balance" />
        <Card title="Tổng thu nhập" amount={income} icon={<ArrowUpCircle />} type="income" />
        <Card title="Tổng chi tiêu" amount={expense} icon={<ArrowDownCircle />} type="expense" />
        <Card title="Các khoản nợ" amount={debt} icon={<Coins />} type="debt" />
        <Card title="Tiết kiệm" amount={savings} icon={<PiggyBank />} type="savings" />
      </div>
    </div>
  );
};
