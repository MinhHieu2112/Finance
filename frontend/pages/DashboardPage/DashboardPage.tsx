import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-hot-toast';
import { SummaryCards } from '../../components/SummaryCards/SummaryCards';
import { TransactionList } from '../../components/TransactionList/TransactionList';
import { TransactionForm } from '../../components/TransactionForm/TransactionForm';
import { CategoryManagerModal } from '../../components/CategoryManagerModal/CategoryManagerModal';
import { AIAssistantModal } from '../../components/AIAssistantModal/AIAssistantModal';
import { ReceiptOCRPanel } from '../../components/ReceiptOCRPanel/ReceiptOCRPanel';
import { ToastModal } from '../../components/ToastModal/ToastModal';
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
import { api, getApiErrorMessage, getApiSuccessMessage } from '../../lib/api';

export const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryModalType, setCategoryModalType] = useState<CategoryType>('expense');
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isReceiptOCROpen, setIsReceiptOCROpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [draftPayload, setDraftPayload] = useState<TransactionPayload | null>(null);
  const [draftQueue, setDraftQueue] = useState<TransactionPayload[]>([]);
  const [pendingDeleteTransactionId, setPendingDeleteTransactionId] = useState<string | null>(null);
  const [deleteTransactionError, setDeleteTransactionError] = useState<string | null>(null);

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
    toast.success(getApiSuccessMessage(data, 'Giao dịch đã được thêm thành công'));
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
    toast.success(getApiSuccessMessage(data, 'Giao dịch đã được cập nhật thành công'));
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
      toast.success(getApiSuccessMessage(data, 'Danh mục đã được thêm thành công'));
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Không thể tạo danh mục'));
    }
  };

  const updateCategory = async (id: string, payload: { name: string; description: string }) => {
    try {
      const response = await api.put<SaveCategoryResponse>(`/categories/edit/${id}`, payload);
      const data = response.data;
      setCategories((prev) => prev.map((item) => (item._id === id ? data.category : item)));
      toast.success(getApiSuccessMessage(data, 'Danh mục đã được cập nhật thành công'));
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Không thể cập nhật danh mục'));
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const response = await api.delete('/categories/delete/' + id);
      setCategories((prev) => prev.filter((item) => item._id !== id));
      toast.success(getApiSuccessMessage(response.data, 'Danh mục đã được xóa thành công'));
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Không thể xóa danh mục'));
    }
  };

  const openCreateForm = () => {
    setEditingTransaction(null);
    setDraftPayload(null);
    setDraftQueue([]);
    setIsFormOpen(true);
  };

  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDraftPayload(null);
    setDraftQueue([]);
    setIsFormOpen(true);
  };

  const closeForm = (reason: 'saved' | 'cancelled' = 'cancelled') => {
    if (reason === 'saved') {
      const [nextDraft, ...restDrafts] = draftQueue;
      if (nextDraft) {
        setEditingTransaction(null);
        setDraftPayload(nextDraft);
        setDraftQueue(restDrafts);
        return;
      }
    }

    setIsFormOpen(false);
    setEditingTransaction(null);
    setDraftPayload(null);
    setDraftQueue([]);
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

  const startDraftReview = (drafts: TransactionPayload[]) => {
    const [firstDraft, ...restDrafts] = drafts;

    setEditingTransaction(null);
    setDraftPayload(firstDraft);
    setDraftQueue(restDrafts);
    setIsFormOpen(true);
  };

  const onAIDraftsPrepared = (drafts: TransactionPayload[]) => {
    setIsAIAssistantOpen(false);
    startDraftReview(drafts);
  };

  const closeAIAssistant = () => {
    setIsAIAssistantOpen(false);
  };

  const deleteTransaction = (id: string) => {
    setPendingDeleteTransactionId(id);
  };

  const confirmDeleteTransaction = async () => {
    if (!pendingDeleteTransactionId) {
      return;
    }

    const targetTransactionId = pendingDeleteTransactionId;

    try {
      setDeleteTransactionError(null);
      const response = await api.delete('/transactions/delete/' + targetTransactionId);
      setTransactions((prev) => prev.filter((t) => t._id !== targetTransactionId));
      toast.success(getApiSuccessMessage(response.data, 'Giao dịch đã xóa thành công'));
    } catch (error) {
      setDeleteTransactionError(getApiErrorMessage(error, 'Không thể xóa giao dịch'));
    } finally {
      setPendingDeleteTransactionId(null);
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
    setIsReceiptOCROpen(false);
    startDraftReview([draftTransaction]);
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Action Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900"> 
              Tổng quan
            </h1>
            <p className="text-gray-500 text-sm">
              Bức tranh nhanh về sức khoẻ tài chính của bạn
            </p>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant   = "secondary"
              onClick   = {openReceiptOCR}
              className = "flex-1 sm:flex-none"
            >
              <ScanText size={18} />
              Quét hóa đơn
            </Button>
            <Button 
              variant   = "secondary" 
              onClick   = {handleGetAdvice} 
              className = "flex-1 sm:flex-none"
            >
              <Sparkles size={18} className="text-purple-500" />
              Trợ lý AI
            </Button>
            <Button
              variant   = "secondary"
              onClick   = {() => openCategoryManager('expense')}
              className = "flex-1 sm:flex-none"
            >
              <Tags size={18} />
              Danh mục
            </Button>
            <Button 
              onClick   = {openCreateForm}
              className = "flex-1 sm:flex-none"
            >
              <Plus size={18} />
              Thêm giao dịch
            </Button>
          </div>
        </div>

        {/* Widgets */}
        <SummaryCards    transactions = {transactions} />
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
          initialPayload={draftPayload}
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
        onDraftsPrepared={onAIDraftsPrepared}
      />

      <ReceiptOCRPanel
        isOpen={isReceiptOCROpen}
        onClose={closeReceiptOCR}
        onDraftPrepared={onReceiptDraftPrepared}
      />

      <ToastModal
        isOpen={Boolean(pendingDeleteTransactionId)}
        type="confirm"
        title="Xác nhận xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này không?"
        confirmText="Xóa"
        cancelText="Hủy"
        onClose={() => setPendingDeleteTransactionId(null)}
        onConfirm={confirmDeleteTransaction}
      />

      <ToastModal
        isOpen={Boolean(deleteTransactionError)}
        type="error"
        title="Xóa thất bại"
        message={deleteTransactionError || ''}
        onClose={() => setDeleteTransactionError(null)}
      />

    </div>
  );
};
