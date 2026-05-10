import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { 
  Plus, 
  Trash2, 
  Pencil, 
  X, 
  Check, 
  Tags,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Search
} from 'lucide-react';
import { api, getApiErrorMessage, getApiSuccessMessage } from '../../lib/api';
import { Button } from '../../components/Button/Button';
import { ToastModal } from '../../components/ToastModal/ToastModal';
import type { 
  Category, 
  CategoryType, 
  ListCategoryResponse, 
  SaveCategoryResponse,
  Catalog,
  ListCatalogResponse
} from '../../types/Categories';
import type { User } from '../../types/Users';

interface CategoriesPageProps {
  user: User;
}

const ITEMS_PER_PAGE = 10;

export const CategoriesPage: React.FC<CategoriesPageProps> = ({ user }) => {
  const [searchParams] = useSearchParams();
  const initialType = (searchParams.get('type') as CategoryType) || 'expense';
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeType, setActiveType] = useState<CategoryType>(initialType);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  
  // States for adding/editing
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [isAddingToCatalog, setIsAddingToCatalog] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCatalogId, setEditingCatalogId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State for deletion confirmation
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  // Tải danh sách các nhóm lớn (Catalogs) từ máy chủ
  const fetchCatalogs = async () => {
    try {
      const response = await api.get<ListCatalogResponse>('/catalogs/list');
      setCatalogs(response.data.catalogs);
    } catch (error) {
      console.error('Không thể tải danh sách catalog');
    }
  };

  // Tải danh sách tất cả các danh mục chi tiết (Categories) từ máy chủ
  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await api.get<ListCategoryResponse>('/categories/list');
      setCategories(response.data.categories);
    } catch (error) {
      toast.error('Không thể tải danh sách danh mục');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchCatalogs();
  }, [user.token]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeType, searchTerm]);

  const filteredCategories = useMemo(() => {
    return categories
      .filter(c => c.type === activeType)
      .filter(c => searchTerm === '' || c.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        const catA = a.catalogName || '';
        const catB = b.catalogName || '';
        if (catA !== catB) return catA.localeCompare(catB, 'vi');
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [categories, activeType, searchTerm]);

  const groupedCategories = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; items: Category[] }>();

    // Khởi tạo các nhóm từ danh sách catalogs của type hiện tại
    catalogs
      .filter(c => c.type === activeType)
      .forEach(catalog => {
        groups.set(catalog._id, { id: catalog._id, name: catalog.name, items: [] });
      });

    filteredCategories.forEach(cat => {
      const catalogId = cat.catalogId || 'uncategorized';
      const catalogName = cat.catalogName || 'Chưa phân loại';
      
      if (!groups.has(catalogId)) {
        groups.set(catalogId, { id: catalogId, name: catalogName, items: [] });
      }
      groups.get(catalogId)?.items.push(cat);
    });

    return Array.from(groups.values()).sort((a, b) => {
      if (a.id === 'uncategorized') return 1;
      if (b.id === 'uncategorized') return -1;
      return a.name.localeCompare(b.name, 'vi');
    });
  }, [filteredCategories, catalogs, activeType]);

  const totalPages = Math.ceil(filteredCategories.length / ITEMS_PER_PAGE);
  
  const paginatedCategories = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredCategories.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredCategories, currentPage]);

  const paginatedGroups = useMemo(() => {
    const groups = new Map<string, { id: string; name: string; items: Category[] }>();

    // Initial groups from catalogs of active type
    catalogs
      .filter(c => c.type === activeType)
      .forEach(catalog => {
        groups.set(catalog._id, { id: catalog._id, name: catalog.name, items: [] });
      });

    paginatedCategories.forEach(cat => {
      const catalogId = cat.catalogId || 'uncategorized';
      const catalogName = cat.catalogName || 'Chưa phân loại';
      
      if (!groups.has(catalogId)) {
        groups.set(catalogId, { id: catalogId, name: catalogName, items: [] });
      }
      groups.get(catalogId)?.items.push(cat);
    });

    return Array.from(groups.values())
      .filter(g => g.items.length > 0 || isAddingToCatalog === g.id)
      .sort((a, b) => {
        if (a.id === 'uncategorized') return 1;
        if (b.id === 'uncategorized') return -1;
        return a.name.localeCompare(b.name, 'vi');
      });
  }, [paginatedCategories, catalogs, activeType, isAddingToCatalog]);

  // Gửi yêu cầu thêm một danh mục mới vào nhóm cụ thể
  const handleAddCategory = async (catalogId: string) => {
    if (!newName.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await api.post<SaveCategoryResponse>('/categories/add', {
        name: newName,
        type: activeType,
        catalogId: catalogId === 'uncategorized' ? undefined : catalogId,
        description: ''
      });
      
      setCategories(prev => [response.data.category, ...prev]);
      toast.success(getApiSuccessMessage(response.data, 'Thêm danh mục thành công'));
      setNewName('');
      setIsAddingToCatalog(null);
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể thêm danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cập nhật thông tin (tên, nhóm) của một danh mục hiện có
  const handleUpdateCategory = async (id: string) => {
    if (!editingName.trim()) return;

    try {
      setIsSubmitting(true);
      const response = await api.put<SaveCategoryResponse>(`/categories/edit/${id}`, {
        name: editingName,
        catalogId: editingCatalogId,
        description: ''
      });
      
      setCategories(prev => prev.map(c => c._id === id ? response.data.category : c));
      toast.success(getApiSuccessMessage(response.data, 'Cập nhật danh mục thành công'));
      setEditingId(null);
      setEditingName('');
      setEditingCatalogId('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể cập nhật danh mục'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Thực hiện xóa hoàn toàn một danh mục khỏi hệ thống
  const handleDeleteCategory = async () => {
    if (!pendingDeleteId) return;

    try {
      setIsSubmitting(true);
      await api.delete(`/categories/delete/${pendingDeleteId}`);
      setCategories(prev => prev.filter(c => c._id !== pendingDeleteId));
      toast.success('Xóa danh mục thành công');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Không thể xóa danh mục'));
    } finally {
      setIsSubmitting(false);
      setPendingDeleteId(null);
    }
  };

  // Định dạng ngày tháng sang kiểu hiển thị Việt Nam (DD/MM/YYYY)
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="border-b border-gray-100 dark:border-[#2a2d3d] pb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Quản lý danh mục</h1>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Tổ chức hệ thống phân loại tài chính chuyên nghiệp</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
          <div className="relative w-full sm:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Tìm nhanh danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#1a1c26] border border-gray-100 dark:border-[#2a2d3d] rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500/50 outline-none transition-all shadow-sm"
            />
          </div>
          <div className="flex bg-gray-100/50 dark:bg-[#13151f] p-1 rounded-2xl border border-gray-200 dark:border-[#2a2d3d] shadow-inner w-full sm:w-auto overflow-x-auto">
            <button
              onClick={() => setActiveType('expense')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeType === 'expense' ? 'bg-white dark:bg-[#1a1c26] text-red-600 dark:text-red-400 shadow-lg border border-red-100/50 dark:border-red-900/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Chi tiêu
            </button>
            <button
              onClick={() => setActiveType('income')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeType === 'income' ? 'bg-white dark:bg-[#1a1c26] text-emerald-600 dark:text-emerald-400 shadow-lg border border-emerald-100/50 dark:border-emerald-900/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Thu nhập
            </button>
            <button
              onClick={() => setActiveType('debt')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeType === 'debt' ? 'bg-white dark:bg-[#1a1c26] text-amber-600 dark:text-amber-400 shadow-lg border border-amber-100/50 dark:border-amber-900/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Khoản nợ
            </button>
            <button
              onClick={() => setActiveType('savings')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${activeType === 'savings' ? 'bg-white dark:bg-[#1a1c26] text-blue-600 dark:text-blue-400 shadow-lg border border-blue-100/50 dark:border-blue-900/30' : 'text-slate-400 hover:text-slate-600'}`}
            >
              Tiết kiệm
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest opacity-60">
            <LayoutGrid size={14} />
            Tổng số: {categories.filter(c => c.type === activeType).length} danh mục
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {paginatedGroups.map((group) => (
          <div key={group.id} className="space-y-4">
            {/* Group Header */}
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800/50 flex items-center justify-center shadow-lg shadow-indigo-600/5">
                  <Tags size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 uppercase tracking-tight">{group.name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.items.length} danh mục con</p>
                </div>
              </div>
              
              <Button 
                variant="secondary"
                onClick={() => setIsAddingToCatalog(group.id)}
                className="rounded-full px-4 py-1.5 text-[10px] border-dashed border-2 hover:border-solid transition-all dark:border-[#2a2d3d] dark:hover:border-indigo-500/50"
              >
                <Plus size={16} />
                Thêm nhanh
              </Button>
            </div>

            {/* Catalog Content Table */}
            <div className="bg-white dark:bg-[#1a1c26] rounded-none border border-gray-100 dark:border-[#2a2d3d] overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-[#13151f]/50 border-b border-gray-100 dark:border-[#2a2d3d]">
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Tên danh mục</th>
                    <th className="px-8 py-4 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Ngày tạo</th>
                    <th className="px-8 py-4 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-[#2a2d3d]">
                  {group.items.map((cat) => (
                    <tr key={cat._id} className="group hover:bg-indigo-50/20 dark:hover:bg-indigo-900/5 transition-colors">
                      <td className="px-8 py-5">
                        {editingId === cat._id ? (
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-in zoom-in-95 duration-200 w-full">
                            <div className="flex flex-col gap-1.5 w-full">
                              <input
                                autoFocus
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateCategory(cat._id)}
                                className="w-full px-4 py-2.5 bg-white dark:bg-[#0f111a] border border-indigo-200 dark:border-indigo-500/50 rounded-xl text-sm outline-none ring-4 ring-indigo-500/10 transition-all font-bold"
                                placeholder="Tên danh mục..."
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <button 
                                onClick={() => handleUpdateCategory(cat._id)}
                                className="p-2.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all shadow-sm bg-white dark:bg-[#1a1c26] border border-emerald-100 dark:border-emerald-900/30"
                              >
                                <Check size={20} />
                              </button>
                              <button 
                                onClick={() => setEditingId(null)}
                                className="p-2.5 text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all border border-transparent"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-indigo-400/30 group-hover:bg-indigo-500 transition-colors"></div>
                            <span className="font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                              {cat.name}
                            </span>
                          </div>
                        )}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs font-medium">
                          <Calendar size={14} className="opacity-50" />
                          {formatDate(cat.createdAt)}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-x-2 group-hover:translate-x-0">
                          <button 
                            onClick={() => { 
                              setEditingId(cat._id); 
                              setEditingName(cat.name);
                              setEditingCatalogId(cat.catalogId || 'uncategorized');
                            }}
                            className="p-2.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all"
                            title="Chỉnh sửa"
                          >
                            <Pencil size={16} />
                          </button>
                          <button 
                            onClick={() => setPendingDeleteId(cat._id)}
                            className="p-2.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-slate-800 rounded-xl shadow-sm border border-transparent hover:border-red-100 dark:hover:border-red-900/30 transition-all"
                            title="Xóa"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {/* Quick Add Row */}
                  {isAddingToCatalog === group.id && (
                    <tr className="bg-indigo-50/30 dark:bg-indigo-900/10 animate-in slide-in-from-top-4 duration-300">
                      <td colSpan={3} className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className="relative flex-1">
                            <Plus className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400" size={18} />
                            <input
                              autoFocus
                              type="text"
                              placeholder="Nhập tên danh mục mới và nhấn Enter..."
                              value={newName}
                              onChange={(e) => setNewName(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory(group.id)}
                              className="w-full pl-12 pr-4 py-3 bg-white dark:bg-[#0f111a] border border-indigo-200 dark:border-indigo-500/30 rounded-[1.25rem] text-sm outline-none focus:ring-4 focus:ring-indigo-500/10"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              onClick={() => handleAddCategory(group.id)}
                              isLoading={isSubmitting}
                              className="px-8 rounded-xl shadow-lg shadow-indigo-600/20"
                            >
                              Xác nhận
                            </Button>
                            <button 
                              onClick={() => { setIsAddingToCatalog(null); setNewName(''); }}
                              className="p-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-white dark:hover:bg-slate-800 rounded-xl transition-all"
                            >
                              <X size={20} />
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                  
                  {group.items.length === 0 && !isAddingToCatalog && (
                    <tr>
                      <td colSpan={3} className="px-8 py-10 text-center text-slate-400 italic text-sm">
                        Chưa có danh mục nào trong nhóm này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
        
        {groupedCategories.length === 0 && !isLoading && (
          <div className="py-32 flex flex-col items-center justify-center space-y-6 bg-white dark:bg-[#1a1c26] rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-[#2a2d3d]">
            <div className="w-24 h-24 rounded-full bg-slate-50 dark:bg-slate-900/50 flex items-center justify-center text-slate-200 dark:text-slate-800">
              <Tags size={48} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-xl font-bold text-slate-900 dark:text-white">Không tìm thấy kết quả</p>
              <p className="text-slate-500">Thử thay đổi từ khóa tìm kiếm hoặc chuyển đổi phân loại.</p>
            </div>
          </div>
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4 pb-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-3 rounded-2xl bg-white dark:bg-[#1a1c26] border border-gray-100 dark:border-[#2a2d3d] text-slate-400 disabled:opacity-30 hover:text-indigo-500 transition-all shadow-sm"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="flex items-center gap-2">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white dark:bg-[#1a1c26] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 border border-gray-100 dark:border-[#2a2d3d]'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-3 rounded-2xl bg-white dark:bg-[#1a1c26] border border-gray-100 dark:border-[#2a2d3d] text-slate-400 disabled:opacity-30 hover:text-indigo-500 transition-all shadow-sm"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Footer Decoration */}
      <div className="pt-10 flex justify-center">
        <div className="px-6 py-2 bg-slate-50 dark:bg-[#13151f] rounded-full text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] border border-gray-100 dark:border-[#2a2d3d]">
          Smart Finance Management System
        </div>
      </div>

      <ToastModal
        isOpen={!!pendingDeleteId}
        type="confirm"
        title="Xác nhận xóa"
        message="Bạn có chắc chắn muốn xóa danh mục này? Tất cả các giao dịch liên quan có thể bị ảnh hưởng."
        confirmText="Xóa vĩnh viễn"
        cancelText="Hủy bỏ"
        onClose={() => setPendingDeleteId(null)}
        onConfirm={handleDeleteCategory}
        isLoading={isSubmitting}
      />
    </div>
  );
};

export default CategoriesPage;
