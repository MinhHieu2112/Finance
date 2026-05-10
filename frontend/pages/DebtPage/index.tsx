import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { TransactionForm } from '../../components/TransactionForm/TransactionForm';
import { ToastModal } from '../../components/ToastModal/ToastModal';
import { CreditCard, ArrowLeft, CheckCircle2, History, TrendingDown, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, getApiErrorMessage } from '../../lib/api';
import { formatCurrency } from '../../lib/currencies';
import { Currency } from '../../types/Transactions';
import type {
  Category,
  CategoryOption,
  DashboardPageProps,
  ListCategoryResponse,
  ListTransactionResponse,
  SaveTransactionResponse,
  Transaction,
  TransactionPayload,
} from '../DashboardPage/types';
import { Debt, DebtStatus, ListDebtResponse } from '../../types/Debts';

const ITEMS_PER_PAGE = 8;

export const DebtPage: React.FC<DashboardPageProps> = ({ user }) => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [pendingDeleteTransactionId, setPendingDeleteTransactionId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'repaid'>('active');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Reset trang khi chuyển Tab
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  // Lọc danh sách các khoản nợ chưa thanh toán (Unpaid)
  const activeDebts = useMemo(() => {
    return debts.filter(d => d.status === DebtStatus.UNPAID);
  }, [debts]);

  // Lọc danh sách các khoản nợ đã thanh toán hoàn toàn (Paid)
  const repaidDebts = useMemo(() => {
    return debts.filter(d => d.status === DebtStatus.PAID);
  }, [debts]);

  // Dữ liệu hiển thị cho Tab hiện tại
  const currentTabData = useMemo(() => {
    return activeTab === 'active' ? activeDebts : repaidDebts;
  }, [activeTab, activeDebts, repaidDebts]);

  // Logic phân trang
  const totalPages = Math.ceil(currentTabData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return currentTabData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [currentTabData, currentPage]);

  // Tính toán tổng số tiền đã đi vay dựa trên toàn bộ bản ghi nợ
  const totalBorrowed = useMemo(() => {
    return debts.reduce((sum, d) => sum + d.amount, 0);
  }, [debts]);

  // Tính toán tổng số tiền đã hoàn trả
  const totalRepaid = useMemo(() => {
    return repaidDebts.reduce((sum, d) => sum + d.amount, 0);
  }, [repaidDebts]);

  // Tính toán dư nợ thực tế còn lại
  const remainingDebt = totalBorrowed - totalRepaid;

  // Chuyển đổi danh mục sang định dạng tùy chọn cho component Form
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

  // Tải toàn bộ dữ liệu cần thiết từ backend (Giao dịch, Danh mục, Khoản nợ)
  const fetchDebts = async () => {
    try {
      setIsLoading(true);
      const [transactionResponse, categoryResponse, debtResponse] = await Promise.all([
        api.get<ListTransactionResponse>('/transactions/list'),
        api.get<ListCategoryResponse>('/categories/list'),
        api.get<ListDebtResponse>('/debts/list'),
      ]);

      setTransactions(transactionResponse.data.transactions);
      setCategories(categoryResponse.data.categories);
      setDebts(debtResponse.data.debts);
    } catch (error) {
      toast.error('Không thể tải dữ liệu khoản nợ');
    } finally {
      setIsLoading(false);
    }
  };

  // Hiệu ứng khởi chạy ban đầu để nạp dữ liệu khi component được gắn vào DOM
  useEffect(() => {
    fetchDebts();
  }, [user.token]);

  // Xử lý lưu giao dịch mới hoặc cập nhật giao dịch hiện có
  const handleSaveTransaction = async (tx: TransactionPayload) => {
    try {
      if (editingTransaction) {
        const response = await api.put<SaveTransactionResponse>(`/transactions/edit/${editingTransaction._id}`, tx);
        setTransactions(prev => prev.map(t => t._id === editingTransaction._id ? response.data.transaction : t));
        toast.success('Cập nhật giao dịch thành công');
      } else {
        const response = await api.post<SaveTransactionResponse>('/transactions/add', tx);
        setTransactions(prev => [response.data.transaction, ...prev]);
        toast.success('Thêm giao dịch mới thành công');
      }
      setIsFormOpen(false);
      fetchDebts(); // Làm mới dữ liệu nợ sau khi giao dịch thay đổi
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể lưu giao dịch'));
    }
  };

  // Thực hiện xóa giao dịch sau khi người dùng đã xác nhận
  const confirmDeleteTransaction = async () => {
    if (!pendingDeleteTransactionId) return;
    try {
      await api.delete(`/transactions/delete/${pendingDeleteTransactionId}`);
      setTransactions(prev => prev.filter(t => t._id !== pendingDeleteTransactionId));
      toast.success('Đã xóa giao dịch');
      fetchDebts(); // Cập nhật lại số liệu nợ sau khi xóa
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xóa giao dịch'));
    } finally {
      setPendingDeleteTransactionId(null);
    }
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header: Chứa tiêu đề và nút quay lại */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-3 tracking-tight">
              Quản lý khoản nợ
            </h1>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Theo dõi dư nợ và lịch sử hoàn trả</p>
          </div>
        </div>
      </div>

      {/* Thẻ thống kê: Hiển thị các con số tổng quát về nợ nần */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white dark:bg-[#1a1c26] p-7 rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2d3d] relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-500/5 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-500 mb-5">
                    <CreditCard size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tổng nợ phát sinh</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalBorrowed, Currency.VND)}</h3>
            </div>
        </div>

        <div className="bg-white dark:bg-[#1a1c26] p-7 rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2d3d] relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-emerald-500/5 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-500 mb-5">
                    <CheckCircle2 size={24} />
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Tổng đã thanh toán</p>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">{formatCurrency(totalRepaid, Currency.VND)}</h3>
            </div>
        </div>

        <div className="bg-primary p-7 rounded-xl shadow-lg shadow-primary/20 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full group-hover:scale-125 transition-transform duration-500"></div>
            <div className="relative z-10">
                <div className="w-12 h-12 rounded-lg bg-white/20 flex items-center justify-center text-white mb-5">
                    <TrendingDown size={24} />
                </div>
                <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1.5">Dư nợ còn lại</p>
                <h3 className="text-2xl font-black text-white">{formatCurrency(remainingDebt, Currency.VND)}</h3>
            </div>
        </div>
      </div>

      {/* Tabs and Content: Danh sách các khoản nợ được phân loại theo trạng thái */}
      <div className="bg-white dark:bg-[#1a1c26] rounded-xl shadow-sm border border-gray-100 dark:border-[#2a2d3d] overflow-hidden min-h-[500px] flex flex-col">
        <div className="px-8 pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-gray-50 dark:border-[#2a2d3d] pb-6">
            <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-lg w-fit">
                <button 
                    onClick={() => setActiveTab('active')}
                    className={`px-6 py-2.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'active' ? 'bg-white dark:bg-[#1a1c26] text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Wallet size={16} />
                    Khoản nợ hiện tại
                </button>
                <button 
                    onClick={() => setActiveTab('repaid')}
                    className={`px-6 py-2.5 rounded-md text-[11px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'repaid' ? 'bg-white dark:bg-[#1a1c26] text-emerald-500 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <History size={16} />
                    Lịch sử trả nợ
                </button>
            </div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {activeTab === 'active' ? `Tìm thấy ${activeDebts.length} khoản nợ` : `Tìm thấy ${repaidDebts.length} khoản nợ đã tất toán`}
            </p>
        </div>

        <div className="flex-1">
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-gray-100 dark:border-[#2a2d3d]">
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thông tin khoản nợ</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Thời gian giao dịch</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Số tiền</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Trạng thái</th>
                            <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map((debt) => (
                            <tr key={debt._id} className="border-b border-gray-50 dark:border-slate-800/50 hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
                                <td className="px-8 py-5">
                                    <div className="flex flex-col">
                                        <span className="font-bold text-slate-900 dark:text-white">{debt.description || debt.transactionId?.description}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                     <div className="flex flex-col">
                                         <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                             {new Date(debt.transactionId?.date || debt.createdAt).toLocaleDateString('vi-VN')}
                                         </span>
                                     </div>
                                 </td>
                                <td className="px-8 py-5 text-right">
                                    <span className="font-black text-slate-900 dark:text-white">{formatCurrency(debt.amount, Currency.VND)}</span>
                                </td>
                                <td className="px-8 py-5 text-center">
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                                        debt.status === DebtStatus.PAID 
                                            ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' 
                                            : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30'
                                    }`}>
                                        {debt.status === DebtStatus.PAID ? 'Đã trả' : 'Chưa trả'}
                                    </span>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex justify-end gap-2">
                                        {debt.status === DebtStatus.UNPAID ? (
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await api.put(`/debts/mark-paid/${debt._id}`);
                                                        toast.success('Đã cập nhật trạng thái đã trả');
                                                        fetchDebts();
                                                    } catch (error) {
                                                        toast.error('Lỗi khi cập nhật trạng thái');
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-all border border-emerald-100 dark:border-emerald-900/30"
                                            >
                                                <CheckCircle2 size={14} />
                                                Đã trả
                                            </button>
                                        ) : (
                                            <button 
                                                onClick={async () => {
                                                    try {
                                                        await api.put(`/debts/mark-unpaid/${debt._id}`);
                                                        toast.success('Đã chuyển về trạng thái chưa trả');
                                                        fetchDebts();
                                                    } catch (error) {
                                                        toast.error('Lỗi khi cập nhật trạng thái');
                                                    }
                                                }}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-[#1a1c26] text-slate-500 dark:text-slate-400 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-200 dark:border-slate-700"
                                            >
                                                <History size={14} />
                                                Chưa trả
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="px-8 py-6 border-t border-gray-50 dark:border-[#2a2d3d] flex items-center justify-between">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Trang {currentPage} / {totalPages}
                    </p>
                    <div className="flex gap-2">
                        <button 
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button 
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-slate-500"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Trạng thái trống: Hiển thị khi không có khoản nợ nào trong tab hiện tại */}
            {currentTabData.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-20 text-center px-6">
                    <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-6">
                        {activeTab === 'active' ? <CreditCard size={40} /> : <CheckCircle2 size={40} />}
                    </div>
                    <h4 className="text-slate-900 dark:text-white font-bold mb-2">Chưa có dữ liệu</h4>
                    <p className="text-sm text-slate-400 max-w-xs">Bắt đầu ghi chép các khoản nợ của bạn để theo dõi dòng tiền tốt hơn.</p>
                </div>
            )}
        </div>
      </div>

      {/* Modal Form Giao dịch: Dùng để thêm mới hoặc chỉnh sửa bản ghi */}
      {isFormOpen && (
        <TransactionForm 
          onSave={handleSaveTransaction}
          onClose={() => setIsFormOpen(false)}
          categoryOptions={categoryFormOptions}
          onManageCategories={(type) => navigate(type ? `/categories?type=${type}` : '/categories')}
          mode={editingTransaction ? 'edit' : 'create'}
          initialTransaction={editingTransaction}
          defaultType={activeTab === 'active' ? 'debt' : 'expense'}
        />
      )}

      {/* Modal Xác nhận xóa: Đảm bảo người dùng không vô tình xóa dữ liệu quan trọng */}
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

export default DebtPage;
