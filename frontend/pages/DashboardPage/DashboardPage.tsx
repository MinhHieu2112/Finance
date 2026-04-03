import React, { useState, useEffect, useMemo } from 'react';
import { SummaryCards } from '../../components/SummaryCards/SummaryCards';
import { TransactionList } from '../../components/TransactionList/TransactionList';
import { TransactionForm } from '../../components/TransactionForm/TransactionForm';
import { Charts } from '../../components/Charts/Charts';
import { CategoryManagerModal } from '../../components/CategoryManagerModal/CategoryManagerModal';
import { AIAssistantModal } from '../../components/AIAssistantModal/AIAssistantModal';
import { ReceiptOCRPanel } from '../../components/ReceiptOCRPanel/ReceiptOCRPanel';
import { Button } from '../../components/Button/Button';
import { Category} from '../../types/Categories';
import { Transaction } from '../../types/Transactions';
import { User } from '../../types/Users';
import { Plus, ScanText, Sparkles, Tags } from 'lucide-react';

const API_BASE_URL = 'http://localhost:4000/api';

interface DashboardPageProps {
  user: User;
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

export const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isReceiptOCROpen, setIsReceiptOCROpen] = useState(false);
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

  const onAssistantTransactionCreated = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev.filter((item) => item.id !== transaction.id)]);
  };

  const closeAIAssistant = () => {
    setIsAIAssistantOpen(false);
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
    setIsAIAssistantOpen(true);
  };

  const openReceiptOCR = () => {
    setIsReceiptOCROpen(true);
  };

  const closeReceiptOCR = () => {
    setIsReceiptOCROpen(false);
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
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
              onClick   = {openReceiptOCR}
              className = "flex-1 sm:flex-none"
            >
              <ScanText size={18} />
              Receipt OCR
            </Button>
            <Button 
              variant   = "secondary" 
              onClick   = {handleGetAdvice} 
              className = "flex-1 sm:flex-none"
            >
              <Sparkles size={18} className="text-purple-500" />
              BOT Assistant
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

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        token={user.token}
        onClose={closeAIAssistant}
        onTransactionCreated={onAssistantTransactionCreated}
      />

      <ReceiptOCRPanel
        isOpen={isReceiptOCROpen}
        token={user.token}
        onClose={closeReceiptOCR}
        onTransactionCreated={onAssistantTransactionCreated}
      />

    </div>
  );
};
