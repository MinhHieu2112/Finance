import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { SummaryCards } from '../../components/SummaryCards/SummaryCards';
import { TransactionList } from '../../components/TransactionList/TransactionList';
import { TransactionForm } from '../../components/TransactionForm/TransactionForm';
import { AIAssistantModal } from '../../components/AIAssistantModal/AIAssistantModal';
import { ReceiptOCRPanel } from '../../components/ReceiptOCRPanel/ReceiptOCRPanel';
import { ToastModal } from '../../components/ToastModal/ToastModal';
import { Charts } from '../../components/Charts/Charts';
import { Button } from '../../components/Button/Button';
import type {
  Category,
  CategoryOption,
  CategoryType,
  DashboardPageProps,
  ListCategoryResponse,
  ListTransactionResponse,
  SaveTransactionResponse,
  Transaction,
  TransactionPayload,
} from './types';
import { Plus, ScanText, Sparkles } from 'lucide-react';
import { api, getApiErrorMessage, getApiSuccessMessage } from '../../lib/api';

// Trang Dashboard hiển thị tổng quan tài chính, biểu đồ và danh sách giao dịch.
export const DashboardPage: React.FC<DashboardPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen]     = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  const [isReceiptOCROpen, setIsReceiptOCROpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [draftPayload, setDraftPayload] = useState<TransactionPayload | null>(null);
  const [draftQueue, setDraftQueue] = useState<TransactionPayload[]>([]);
  const [pendingDeleteTransactionId, setPendingDeleteTransactionId] = useState<string | null>(null);

  // Chuẩn bị danh sách danh mục cho form từ danh sách danh mục hiện có.
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

  // Tải dữ liệu ban đầu cho dashboard gồm giao dịch và danh mục.
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
        toast.error('Không thể tải dữ liệu. Vui lòng kiểm tra kết nối.');
      }
    };

    loadDashboardData();
  }, [user.token]);

  // Gọi API để tạo một giao dịch mới.
  const createTransaction = async (newTx: TransactionPayload): Promise<Transaction> => {
    try {
      const response = await api.post<SaveTransactionResponse>('/transactions/add', newTx);
      const data = response.data;
      toast.success(getApiSuccessMessage(data, 'Giao dịch đã được thêm thành công'));
      return data.transaction;
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể thêm giao dịch');
      toast.error(message);
      throw new Error(message);
    }
  };

  // Thêm giao dịch mới vào danh sách hiển thị sau khi tạo thành công.
  const addTransaction = async (newTx: TransactionPayload) => {
    const createdTransaction = await createTransaction(newTx);
    setTransactions((prev) => [createdTransaction, ...prev]);
  };

  // Cập nhật thông tin một giao dịch hiện có.
  const updateTransaction = async (id: string, updatedTx: TransactionPayload) => {
    try {
      const response = await api.put<SaveTransactionResponse>(`/transactions/edit/${id}`, updatedTx);
      const data = response.data;
      setTransactions((prev) => prev.map((t) => (t._id === id ? data.transaction : t)));
      toast.success(getApiSuccessMessage(data, 'Giao dịch đã được cập nhật thành công'));
    } catch (error) {
      const message = getApiErrorMessage(error, 'Không thể cập nhật giao dịch');
      toast.error(message);
      throw new Error(message);
    }
  };

  // Xử lý lưu giao dịch (tạo mới hoặc chỉnh sửa).
  const handleSaveTransaction = async (tx: TransactionPayload) => {
    if (editingTransaction) {
      await updateTransaction(editingTransaction._id, tx);
      return;
    }

    await addTransaction(tx);
  };

  // Xử lý lưu giao dịch (tạo mới hoặc chỉnh sửa).

  // Mở biểu mẫu để tạo một giao dịch mới.
  const openCreateForm = () => {
    setEditingTransaction(null);
    setDraftPayload(null);
    setDraftQueue([]);
    setIsFormOpen(true);
  };

  // Mở biểu mẫu để chỉnh sửa một giao dịch có sẵn.
  const openEditForm = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setDraftPayload(null);
    setDraftQueue([]);
    setIsFormOpen(true);
  };

  // Đóng biểu mẫu giao dịch và dọn dẹp trạng thái tạm thời.
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

  // Điều hướng người dùng đến trang quản lý danh mục.
  const openCategoryManager = (type?: CategoryType) => {
    navigate(type ? `/categories?type=${type}` : '/categories');
  };

  const openCategoryManagerFromForm = (type?: CategoryType) => {
    navigate(type ? `/categories?type=${type}` : '/categories');
  };

  // Bắt đầu quy trình kiểm tra các giao dịch nháp được tạo bởi AI.
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

  // Đặt ID giao dịch cần xóa và mở hộp thoại xác nhận.
  const deleteTransaction = (id: string) => {
    setPendingDeleteTransactionId(id);
  };

  // Xác nhận và thực hiện xóa giao dịch qua API.
  const confirmDeleteTransaction = async () => {
    if (!pendingDeleteTransactionId) {
      return;
    }

    const targetTransactionId = pendingDeleteTransactionId;

    try {
      const response = await api.delete('/transactions/delete/' + targetTransactionId);
      setTransactions((prev) => prev.filter((t) => t._id !== targetTransactionId));
      toast.success(getApiSuccessMessage(response.data, 'Giao dịch đã xóa thành công'));
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xóa giao dịch'));
    } finally {
      setPendingDeleteTransactionId(null);
    }
  };

  // Mở hộp thoại Trợ lý AI để nhận tư vấn tài chính.
  const handleGetAdvice = () => {
    setIsAIAssistantOpen(true);
  };

  // Mở chức năng quét hóa đơn bằng OCR.
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white"> 
              Tổng quan
            </h1>
          </div>
          <div className="flex gap-3 w-full sm:w-auto">
            <Button
              variant   = "secondary"
              onClick   = {openReceiptOCR}
              className = "flex-1 sm:flex-none"
            >
              <ScanText size={18} />
              Trích xuất hóa đơn
            </Button>
            <Button 
              variant   = "secondary" 
              onClick   = {handleGetAdvice} 
              className = "flex-1 sm:flex-none"
            >
              <Sparkles size={18} className="text-primary" />
              Trợ lý AI
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
        <div className="my-8">
          <Charts transactions={transactions} />
        </div>
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
        isOpen={!!pendingDeleteTransactionId}
        type="confirm"
        title="Xóa giao dịch"
        message="Bạn có chắc chắn muốn xóa giao dịch này không? Hành động này không thể hoàn tác."
        confirmText="Xóa"
        cancelText="Hủy"
        onClose={() => setPendingDeleteTransactionId(null)}
        onConfirm={confirmDeleteTransaction}
      />

    </div>
  );
};
