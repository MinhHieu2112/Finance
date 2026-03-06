import React, { useMemo } from 'react';
import { Transaction, TransactionType } from '../../types';
import { ArrowUpCircle, ArrowDownCircle, Wallet } from 'lucide-react';

interface SummaryCardsProps {
  transactions: Transaction[];
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ transactions }) => {
  const { income, expense, balance } = useMemo(() => {
    let income = 0;
    let expense = 0;

    transactions.forEach((t) => {
      if (t.type === TransactionType.INCOME) income += t.amount;
      else expense += t.amount;
    });

    return { income, expense, balance: income - expense };
  }, [transactions]);

  const Card = ({ title, amount, icon, colorClass }: { title: string; amount: number; icon: React.ReactNode; colorClass: string }) => (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
        <h3 className={`text-2xl font-bold ${colorClass}`}>{amount.toLocaleString('vi-VN')} đ</h3>
      </div>
      <div className={`p-3 rounded-full opacity-90 ${colorClass.replace('text', 'bg').replace('600', '100').replace('500', '100')}`}>
        {icon}
      </div>
    </div>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card title="Tổng số dư" amount={balance} icon={<Wallet className="text-primary w-6 h-6" />} colorClass="text-primary" />
      <Card title="Tổng thu nhập" amount={income} icon={<ArrowUpCircle className="text-emerald-600 w-6 h-6" />} colorClass="text-emerald-600" />
      <Card title="Tổng chi tiêu" amount={expense} icon={<ArrowDownCircle className="text-red-500 w-6 h-6" />} colorClass="text-red-500" />
    </div>
  );
};
