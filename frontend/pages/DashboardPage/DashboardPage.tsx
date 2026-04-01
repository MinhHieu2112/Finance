import React, { useState, useEffect, useMemo } from 'react';
import { SummaryCards } from '../../components/SummaryCards/SummaryCards';
import { TransactionList } from '../../components/TransactionList/TransactionList';
import { TransactionForm } from '../../components/TransactionForm/TransactionForm';
import { Charts } from '../../components/Charts/Charts';
import { CategoryManagerModal } from '../../components/CategoryManagerModal/CategoryManagerModal';
import { Button } from '../../components/Button/Button';
import { Category} from '../../types/Categories';
import { Transaction } from '../../types/Transactions';
import { User } from '../../types/Users';
import { Plus, Sparkles, LogOut, User as UserIcon, Tags } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api';

interface DashboardPageProps {
  user: User;
  onLogout: () => void;
}

interface ListTransactionResponse {
  success: boolean;
  transactions: Transaction[];
}

interface SaveTransactionResponse {
  success: boolean;
  transaction: Transaction;
}

interface ListCategoryResponse {
  success: boolean;
  categories: Category[];
}

interface SaveCategoryResponse {
  success: boolean;
  category: Category;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ user, onLogout }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const categoryOptions = useMemo(() => {
    const names = categories.map((category) => category.name.trim()).filter(Boolean);
    return Array.from(new Set(names));
  }, [categories]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [transactionResponse, categoryResponse] = await Promise.all([
          fetch(`${API_BASE_URL}/transactions/list`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }),
          fetch(`${API_BASE_URL}/categories/list`, {
            headers: {
              Authorization: `Bearer ${user.token}`,
            },
          }),
        ]);

        if (!transactionResponse.ok) {
          throw new Error('Cannot load transactions');
        }

        if (!categoryResponse.ok) {
          throw new Error('Cannot load categories');
        }

        const transactionData: ListTransactionResponse = await transactionResponse.json();
        const categoryData: ListCategoryResponse = await categoryResponse.json();

        setTransactions(transactionData.transactions);
        setCategories(categoryData.categories);
      } catch (error) {
        console.error(error);
      }
    };

    loadDashboardData();
  }, [user.token]);

  const addTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/transactions/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(newTx),
    });

    if (!response.ok) {
      throw new Error('Cannot create transaction');
    }

    const data: SaveTransactionResponse = await response.json();
    setTransactions((prev) => [data.transaction, ...prev]);
  };

  const updateTransaction = async (id: string, updatedTx: Omit<Transaction, 'id'>) => {
    const response = await fetch(`${API_BASE_URL}/transactions/edit/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(updatedTx),
    });

    if (!response.ok) {
      throw new Error('Cannot update transaction');
    }

    const data: SaveTransactionResponse = await response.json();
    setTransactions((prev) => prev.map((t) => (t.id === id ? data.transaction : t)));
  };

  const handleSaveTransaction = async (tx: Omit<Transaction, 'id'>) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction.id, tx);
      return;
    }

    await addTransaction(tx);
  };

  const createCategory = async (payload: { name: string; description: string }) => {
    const response = await fetch(`${API_BASE_URL}/categories/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Cannot create category');
    }

    const data: SaveCategoryResponse = await response.json();
    setCategories((prev) => [data.category, ...prev.filter((item) => item.id !== data.category.id)]);
  };

  const updateCategory = async (id: string, payload: { name: string; description: string }) => {
    const response = await fetch(`${API_BASE_URL}/categories/edit/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user.token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error('Cannot update category');
    }

    const data: SaveCategoryResponse = await response.json();
    setCategories((prev) => prev.map((item) => (item.id === id ? data.category : item)));
  };

  const deleteCategory = async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/categories/delete/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${user.token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Cannot delete category');
    }

    setCategories((prev) => prev.filter((item) => item.id !== id));
  };

  const openCreateForm = () => {
    setEditingTransaction(null);
    setIsFormOpen(true);
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
  };

  const openCategoryManager = () => {
    setIsCategoryModalOpen(true);
  };

  const closeCategoryManager = () => {
    setIsCategoryModalOpen(false);
  };

  const openCategoryManagerFromForm = () => {
    closeForm();
    setIsCategoryModalOpen(true);
  };

  const deleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      const response = await fetch(`${API_BASE_URL}/transactions/delete/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Cannot delete transaction');
      }

      setTransactions((prev) => prev.filter((t) => t.id !== id));
    }
  };

  const handleGetAdvice = () => {
    // Assistant button is kept intentionally, but analysis is now displayed in the sidebar.
    return;
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
              title="Log out"
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
              Overview
            </h1>
            <p className="text-gray-500 text-sm">
              A quick snapshot of your financial health
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button 
              variant   = "secondary" 
              onClick   = {handleGetAdvice} 
              className = "flex-1 sm:flex-none"
            >
              <Sparkles size={18} className="text-purple-500" />
              AI Assistant
            </Button>
            <Button
              variant   = "secondary"
              onClick   = {openCategoryManager}
              className = "flex-1 sm:flex-none"
            >
              <Tags size={18} />
              Categories
            </Button>
            <Button 
              onClick   = {openCreateForm}
              className = "flex-1 sm:flex-none"
            >
              <Plus size={18} />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Widgets */}
        <SummaryCards    transactions = {transactions} />
        <Charts          transactions = {transactions} />
        <TransactionList
          transactions={transactions}
          categoryOptions={categoryOptions}
          onDelete={deleteTransaction}
          onEdit={openEditForm}
        />
      </main>

      {/* Footer */}
      <footer className = "bg-white border-t border-gray-200 mt-auto">
        <div  className = "max-w-7xl mx-auto px-4 py-6 text-center text-gray-400 text-sm">
          &copy; {new Date().getFullYear()} SmartFinance. Built for smarter personal finance management.
        </div>
      </footer>

      {/* Add Transaction Modal */}
      {isFormOpen && (
        <TransactionForm 
          onSave={handleSaveTransaction}
          onClose={closeForm}
          categoryOptions={categoryOptions}
          onManageCategories={openCategoryManagerFromForm}
          mode={editingTransaction ? 'edit' : 'create'}
          initialTransaction={editingTransaction}
        />
      )}

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        onClose={closeCategoryManager}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />

    </div>
  );
};