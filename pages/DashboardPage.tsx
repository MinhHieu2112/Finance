import React, { useState, useEffect } from 'react';
import { SummaryCards } from '../features/analytics/SummaryCards';
import { TransactionList } from '../features/transaction/TransactionList';
import { TransactionForm } from '../features/transaction/TransactionForm';
import { Charts } from '../features/analytics/Charts';
import { FinancialAdvisorModal } from '../features/ai/FinancialAdvisorModal';
import { Button } from '../components/Button';
import { INITIAL_TRANSACTIONS } from '../constants';
import { Transaction, User } from '../types';
import { getFinancialAdvice } from '../services/geminiService';
import { Plus, Sparkles, LogOut, User as UserIcon } from 'lucide-react';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  // AI Advice State
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [showAdviceModal, setShowAdviceModal] = useState(false);

  // Load transactions from local storage on mount
  useEffect(() => {
    const savedTransactions = localStorage.getItem('smart_finance_transactions');
    if (savedTransactions) {
      setTransactions(JSON.parse(savedTransactions));
    }
  }, []);

  // Persist transactions when changed
  useEffect(() => {
    localStorage.setItem('smart_finance_transactions', JSON.stringify(transactions));
  }, [transactions]);

  const addTransaction = (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: crypto.randomUUID(),
    };
    setTransactions([transaction, ...transactions]);
  };

  const deleteTransaction = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      setTransactions(transactions.filter(t => t.id !== id));
    }
  };

  const handleGetAdvice = async () => {
    setShowAdviceModal(true);
    if (!aiAdvice) {
      setLoadingAdvice(true);
      const advice = await getFinancialAdvice(transactions);
      setAiAdvice(advice);
      setLoadingAdvice(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white shadow-sm z-10 sticky top-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-primary rounded-lg p-2">
               <span className="text-white font-bold text-lg">SF</span>
            </div>
            <span className="text-xl font-bold text-gray-800">SmartFinance</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 text-gray-600 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-200">
              <UserIcon size={16} />
              <span className="text-sm font-medium">{user.username}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-danger transition-colors rounded-full hover:bg-gray-100"
              title="Đăng xuất"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
            <p className="text-gray-500 text-sm">Tổng quan về sức khỏe tài chính của bạn</p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant="secondary" 
              onClick={handleGetAdvice} 
              className="flex-1 sm:flex-none"
            >
              <Sparkles size={18} className="text-purple-500" />
              Trợ lý ảo
            </Button>
            <Button 
              onClick={() => setIsFormOpen(true)}
              className="flex-1 sm:flex-none"
            >
              <Plus size={18} />
              Thêm giao dịch
            </Button>
          </div>
        </div>

        {/* Widgets */}
        <SummaryCards transactions={transactions} />
        
        <Charts transactions={transactions} />

        <TransactionList transactions={transactions} onDelete={deleteTransaction} />

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} SmartFinance. Thiết kế tối ưu cho quản lý tài chính.
        </div>
      </footer>

      {/* Add Transaction Modal */}
      {isFormOpen && (
        <TransactionForm 
          onSave={addTransaction} 
          onClose={() => setIsFormOpen(false)} 
        />
      )}

      {/* AI Advice Modal */}
      <FinancialAdvisorModal 
        isOpen={showAdviceModal} 
        onClose={() => setShowAdviceModal(false)}
        loading={loadingAdvice}
        advice={aiAdvice}
      />
    </div>
  );
};