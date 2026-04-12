import React, { useState, useEffect, useMemo } from 'react';
import { SummaryCards } from '../../components/SummaryCards/SummaryCards';
import { TransactionList } from '../../components/TransactionList/TransactionList';
import { TransactionForm } from '../../components/TransactionForm/TransactionForm';
import { Charts } from '../../components/Charts/Charts';
import { CategoryManagerModal } from '../../components/CategoryManagerModal/CategoryManagerModal';
import { AIAssistantModal } from '../../components/AIAssistantModal/AIAssistantModal';
import { ReceiptOCRPanel } from '../../components/ReceiptOCRPanel/ReceiptOCRPanel';
import { Button } from '../../components/Button/Button';
import type {
  Category,
  CategoryOption,
  CategoryType,
  DashboardPageProps,
  ListCategoryResponse,
  ListTransactionResponse,
  SaveCategoryResponse,
  SaveTransactionResponse,
  Transaction,
  TransactionPayload,
} from './types';
import { Plus, ScanText, Sparkles, Tags } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';

export const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalType, setCategoryModalType] = useState<CategoryType>('expense');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isReceiptOCROpen, setIsReceiptOCROpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [receiptDraftPayload, setReceiptDraftPayload] = useState<TransactionPayload | null>(null);

  const categoryFormOptions = useMemo<CategoryOption[]>(() => {
    return categories
      .map((category) => ({
        _id: category._id,
        catalogId: category.catalogId,
        catalogName: category.catalogName,
        name: category.name.trim(),
        type: category.type,
      }))
      .filter((category) => Boolean(category.name));
  }, [categories]);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [transactionResponse, categoryResponse] = await Promise.all([
          api.get<ListTransactionResponse>('/transactions/list'),
          api.get<ListCategoryResponse>('/categories/list'),
        ]);

        const transactionData = transactionResponse.data;
        const categoryData = categoryResponse.data;

        setTransactions(transactionData.transactions);
        setCategories(categoryData.categories);
      } catch (error) {
        console.error(error);
      }
    };

    loadDashboardData();
  }, [user.token]);

  const createTransaction = async (newTx: TransactionPayload): Promise<Transaction> => {
    const response = await api.post<SaveTransactionResponse>('/transactions/add', newTx);
    const data = response.data;
    return data.transaction;
  };

  const addTransaction = async (newTx: TransactionPayload) => {
    const createdTransaction = await createTransaction(newTx);
    setTransactions((prev) => [createdTransaction, ...prev]);
  };

  const updateTransaction = async (id: string, updatedTx: TransactionPayload) => {
    const response = await api.put<SaveTransactionResponse>(`/transactions/edit/${id}`, updatedTx);
    const data = response.data;
    setTransactions((prev) => prev.map((t) => (t._id === id ? data.transaction : t)));
  };

  const handleSaveTransaction = async (tx: TransactionPayload) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction._id, tx);
      return;
    }

    await addTransaction(tx);
  };

  const createCategory = async (payload: { name: string; description: string; type: CategoryType; catalogId?: string }) => {
    try {
      const response = await api.post<SaveCategoryResponse>('/categories/add', payload);
      const data = response.data;
      setCategories((prev) => [data.category, ...prev.filter((item) => item._id !== data.category._id)]);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Cannot create category'));
    }
  };

  const updateCategory = async (id: string, payload: { name: string; description: string }) => {
    try {
      const response = await api.put<SaveCategoryResponse>(`/categories/edit/${id}`, payload);
      const data = response.data;
      setCategories((prev) => prev.map((item) => (item._id === id ? data.category : item)));
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Cannot update category'));
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      await api.delete(`/categories/delete/${id}`);
      setCategories((prev) => prev.filter((item) => item._id !== id));
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Cannot delete category'));
    }
  };

  const openCreateForm = () => {
    setEditingTransaction(null);
    setReceiptDraftPayload(null);
    setIsFormOpen(true);
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setReceiptDraftPayload(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingTransaction(null);
    setReceiptDraftPayload(null);
  };

  const openCategoryManager = (type: CategoryType = 'expense') => {
    setCategoryModalType(type);
    setIsCategoryModalOpen(true);
  };

  const closeCategoryManager = () => {
    setIsCategoryModalOpen(false);
  };

  const openCategoryManagerFromForm = (type: CategoryType) => {
    closeForm();
    setCategoryModalType(type);
    setIsCategoryModalOpen(true);
  };

  const onAssistantTransactionCreated = (transaction: Transaction) => {
    setTransactions((prev) => [transaction, ...prev.filter((item) => item._id !== transaction._id)]);
  };

  const closeAIAssistant = () => {
    setIsAIAssistantOpen(false);
  };

  const deleteTransaction = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      await api.delete(`/transactions/delete/${id}`);

      setTransactions((prev) => prev.filter((t) => t._id !== id));
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

  const onReceiptDraftPrepared = (draftTransaction: TransactionPayload) => {
    setEditingTransaction(null);
    setReceiptDraftPayload(draftTransaction);
    setIsReceiptOCROpen(false);
    setIsFormOpen(true);
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
              onClick   = {() => openCategoryManager('expense')}
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
          categoryOptions={categoryFormOptions}
          onDelete={deleteTransaction}
          onEdit={openEditForm}
        />

      {/* Add Transaction Modal */}
      {isFormOpen && (
        <TransactionForm 
          onSave={handleSaveTransaction}
          onClose={closeForm}
          categoryOptions={categoryFormOptions}
          onManageCategories={openCategoryManagerFromForm}
          mode={editingTransaction ? 'edit' : 'create'}
          initialTransaction={editingTransaction}
          initialPayload={receiptDraftPayload}
        />
      )}

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        categories={categories}
        activeType={categoryModalType}
        onTypeChange={setCategoryModalType}
        onClose={closeCategoryManager}
        onCreate={createCategory}
        onUpdate={updateCategory}
        onDelete={deleteCategory}
      />

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={closeAIAssistant}
        onTransactionCreated={onAssistantTransactionCreated}
      />

      <ReceiptOCRPanel
        isOpen={isReceiptOCROpen}
        onClose={closeReceiptOCR}
        onDraftPrepared={onReceiptDraftPrepared}
      />

    </div>
  );
};
