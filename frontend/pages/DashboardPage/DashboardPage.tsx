import React, { useState, useEffect } from 'react';
import { SummaryCards } from '../../components/SummaryCards/SummaryCards';
import { TransactionList } from '../../components/TransactionList/TransactionList';
import { TransactionForm } from '../../components/TransactionForm/TransactionForm';
import { Charts } from '../../components/Charts/Charts';
import { FinancialAdvisorModal } from '../../components/FinancialAdvisorModal/FinancialAdvisorModal';
import { Button } from '../../components/Button/Button';
import { Transaction, User } from '../../types';
import { getFinancialAdvice } from '../../components/GeminiService/geminiService';
import { Plus, Sparkles, LogOut, User as UserIcon } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isFormOpen, setIsFormOpen]     = useState(false);
  
  // AI Advice State
  const [aiAdvice, setAiAdvice]               = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice]     = useState(false);
  const [showAdviceModal, setShowAdviceModal] = useState(false);

  // Load transactions from backend on mount.
  useEffect(() => {
    const loadTransactions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/transactions`);
        if (!response.ok) throw new Error('Cannot load transactions');
        const data = await response.json();
        setTransactions(data);
      } catch (error) {
        console.error(error);
      }
    };

    loadTransactions();
  }, []);

  const addTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const transaction: Transaction = {
      ...newTx,
      id: crypto.randomUUID(),
    };

    const response = await fetch(`${API_BASE_URL}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transaction),
    });

    if (!response.ok) {
      throw new Error('Cannot create transaction');
    }

    const createdTransaction: Transaction = await response.json();
    setTransactions((prev) => [createdTransaction, ...prev]);
  };

  const deleteTransaction = async (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa giao dịch này?')) {
      const response = await fetch(`${API_BASE_URL}/transactions/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Cannot delete transaction');
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
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
            <h1 className="text-2xl font-bold text-gray-900"> 
              Tổng quan
            </h1>
            <p className="text-gray-500 text-sm">
              Tổng quan về sức khỏe tài chính của bạn
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant   = "secondary" 
              onClick   = {handleGetAdvice} 
              className = "flex-1 sm:flex-none"
            >
              <Sparkles size={18} className="text-purple-500" />
              Trợ lý ảo
            </Button>
            <Button 
              onClick   = {() => setIsFormOpen(true)}
              className = "flex-1 sm:flex-none"
            >
              <Plus size={18} />
              Thêm giao dịch
            </Button>
          </div>
        </div>

        {/* Widgets */}
        <SummaryCards    transactions = {transactions} />        
        <Charts          transactions = {transactions} />
        <TransactionList transactions = {transactions} onDelete={deleteTransaction} />
      </main>

      {/* Footer */}
      <footer className = "bg-white border-t border-gray-200 mt-auto">
        <div  className = "max-w-7xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} SmartFinance. Thiết kế tối ưu cho quản lý tài chính.
        </div>
      </footer>

      {/* Add Transaction Modal */}
      {isFormOpen && (
        <TransactionForm 
          onSave  = {addTransaction} 
          onClose = {() => setIsFormOpen(false)} 
        />
      )}

      {/* AI Advice Modal */}
      <FinancialAdvisorModal 
        isOpen  = {showAdviceModal} 
        onClose = {() => setShowAdviceModal(false)}
        loading = {loadingAdvice}
        advice  = {aiAdvice}
      />
    </div>
  );
};