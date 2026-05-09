import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../Button/Button';
import { Pencil, Trash2, X } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Category, CategoryManagerModalProps, CategoryType } from './types';
import { ToastModal } from '../ToastModal/ToastModal';

const CATEGORY_TYPE_LABEL: Record<CategoryType, string> = {
  income: 'Thu nhập',
  expense: 'Chi tiêu',
  debt: 'Khoản nợ',
  savings: 'Tiết kiệm',
};

// Cửa sổ quản lý danh mục, cho phép người dùng thêm, sửa, xóa và phân loại các hạng mục chi tiêu/thu nhập.
export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
  activeType,
  onTypeChange,
  onClose,
  onCreate,
  onUpdate,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingDescription, setEditingDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingAction, setPendingAction] = useState<{ type: 'update' | 'delete'; categoryId: string } | null>(null);
  const [catalogFilterId, setCatalogFilterId] = useState('all');
  const [createCatalogId, setCreateCatalogId] = useState('');

  // Trích xuất danh sách các catalog (nhóm chính) duy nhất từ danh sách danh mục.
  const catalogOptions = useMemo(() => {
    const map = new Map<string, { catalogId: string; catalogName: string }>();

    categories
      .filter((category) => category.type === activeType)
      .forEach((category) => {
        const catalogId = category.catalogId;
        if (!catalogId) {
          return;
        }

        if (!map.has(catalogId)) {
          map.set(catalogId, {
            catalogId,
            catalogName: category.catalogName || 'Uncategorized Catalog',
          });
        }
      });

    return Array.from(map.values()).sort((a, b) => a.catalogName.localeCompare(b.catalogName, 'en'));
  }, [categories, activeType]);

  useEffect(() => {
    if (catalogFilterId !== 'all' && !catalogOptions.some((option) => option.catalogId === catalogFilterId)) {
      setCatalogFilterId('all');
    }

    if (!catalogOptions.length) {
      setCreateCatalogId('');
      return;
    }

    if (!catalogOptions.some((option) => option.catalogId === createCatalogId)) {
      setCreateCatalogId(catalogOptions[0].catalogId);
    }
  }, [catalogOptions, catalogFilterId, createCatalogId]);

  // Lọc và sắp xếp danh sách danh mục theo nhóm và tên.
  const sortedCategories = useMemo(() => {
    return [...categories]
      .filter((category) => category.type === activeType)
      .filter((category) => (catalogFilterId === 'all' ? true : category.catalogId === catalogFilterId))
      .sort((a, b) => a.name.localeCompare(b.name, 'en'));
  }, [categories, activeType, catalogFilterId]);

  if (!isOpen) {
    return null;
  }

  const resetCreateForm = () => {
    setName('');
    setDescription('');
  };

  const startEdit = (category: Category) => {
    setEditingCategoryId(category._id);
    setEditingName(category.name);
    setEditingDescription(category.description || '');
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditingName('');
    setEditingDescription('');
  };

  // Xử lý tạo danh mục mới.
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);
      await onCreate({ name, description, type: activeType, catalogId: createCatalogId || undefined });
      toast.success('Thêm danh mục thành công!');
      resetCreateForm();
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Không thể tạo danh mục. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = () => {
    if (!editingCategoryId) {
      return;
    }

    setPendingAction({ type: 'update', categoryId: editingCategoryId });
  };

  const requestDelete = (id: string) => {
    setPendingAction({ type: 'delete', categoryId: id });
  };

  // Xác nhận và thực hiện hành động (cập nhật hoặc xóa).
  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      setIsSubmitting(true);

      if (pendingAction.type === 'update') {
        await onUpdate(pendingAction.categoryId, { name: editingName, description: editingDescription });
        toast.success('Cập nhật danh mục thành công!');
        cancelEdit();
      } else {
        await onDelete(pendingAction.categoryId);
        toast.success('Xóa danh mục thành công!');
        if (editingCategoryId === pendingAction.categoryId) {
          cancelEdit();
        }
      }
    } catch (submitError) {
      toast.error(submitError instanceof Error ? submitError.message : 'Không thể hoàn tất hành động. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const isUpdateAction = pendingAction?.type === 'update';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-[#1a1c26] rounded-[2rem] w-full max-w-2xl p-6 relative shadow-2xl animate-fade-in-up max-h-[90vh] overflow-auto border border-gray-100 dark:border-[#2a2d3d] transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-5 right-5 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors p-2" aria-label="Close">
          <X size={22} />
        </button>

        <h2 className="text-xl font-black mb-4 text-gray-900 dark:text-white tracking-tight">Quản lý danh mục</h2>

        <div className="mb-6 inline-flex rounded-2xl border border-gray-100 dark:border-[#2a2d3d] p-1 bg-gray-50 dark:bg-[#13151f]">
          <button
            type="button"
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeType === 'expense' ? 'bg-white dark:bg-[#1a1c26] shadow-md text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
            onClick={() => onTypeChange('expense')}
          >
            Chi tiêu
          </button>
          <button
            type="button"
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeType === 'income' ? 'bg-white dark:bg-[#1a1c26] shadow-md text-emerald-600 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}
            onClick={() => onTypeChange('income')}
          >
            Thu nhập
          </button>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-8">
          <div className="md:col-span-1">
            <select
              value={createCatalogId}
              onChange={(event) => setCreateCatalogId(event.target.value)}
              className="w-full px-3 py-2 border border-gray-200 dark:border-[#2a2d3d] rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-[#13151f] text-xs text-gray-700 dark:text-slate-200"
            >
              {!catalogOptions.length && <option value="">- Chọn nhóm -</option>}
              {catalogOptions.map((option) => (
                <option key={option.catalogId} value={option.catalogId}>
                  {option.catalogName}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tên danh mục mới..."
              className="w-full px-4 py-2 border border-gray-200 dark:border-[#2a2d3d] rounded-xl focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-[#13151f] text-xs text-gray-700 dark:text-slate-200"
            />
          </div>
          <div className="md:col-span-1">
            <Button type="submit" isLoading={isSubmitting} className="w-full py-2 shadow-lg shadow-primary/10 text-xs">Thêm mới</Button>
          </div>
        </form>

        <div className="border border-gray-100 dark:border-[#2a2d3d] rounded-2xl overflow-hidden shadow-sm">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-gray-50 dark:bg-[#13151f]/50 text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-5 py-3">Nhóm chính</th>
                <th className="px-5 py-3">Tên hiển thị</th>
                <th className="px-5 py-3 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-[#2a2d3d]">
              {sortedCategories.map((category) => {
                const isEditing = editingCategoryId === category._id;

                return (
                  <tr key={category._id} className="hover:bg-gray-50/50 dark:hover:bg-[#13151f]/30 transition-colors group">
                    <td className="px-5 py-3 text-[11px] font-bold text-slate-500 dark:text-slate-500">{category.catalogName || '-'}</td>
                    <td className="px-5 py-3">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-1.5 border border-indigo-200 dark:border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-primary/20 outline-none bg-white dark:bg-[#0f111a] text-xs"
                        />
                      ) : (
                        <span className="font-bold text-gray-800 dark:text-slate-200 group-hover:text-primary dark:group-hover:text-indigo-400 transition-colors">{category.name}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        {isEditing ? (
                          <>
                            <Button type="button" variant="secondary" onClick={cancelEdit} disabled={isSubmitting} className="text-[10px] py-1 px-2">Hủy</Button>
                            <Button type="button" onClick={handleSaveEdit} isLoading={isSubmitting} className="text-[10px] py-1 px-2">Lưu</Button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="text-gray-400 hover:text-primary dark:hover:text-indigo-400 transition-all p-1.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg"
                              title="Chỉnh sửa"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete(category._id)}
                              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                              title="Xóa"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {sortedCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-2">
                       <p className="text-sm font-bold text-slate-400 dark:text-slate-600 italic">Chưa có danh mục nào được tạo.</p>
                       <p className="text-xs text-slate-400 dark:text-slate-600">Hãy bắt đầu bằng cách thêm danh mục đầu tiên của bạn!</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ToastModal
          isOpen={Boolean(pendingAction)}
          type="confirm"
          title={isUpdateAction ? 'Xác nhận sửa danh mục' : 'Xác nhận xóa danh mục'}
          message={isUpdateAction ? 'Bạn có muốn lưu các thay đổi cho danh mục này không?' : 'Danh mục này sẽ bị xóa vĩnh viễn.'}
          confirmText={isUpdateAction ? 'Lưu thay đổi' : 'Xóa'}
          cancelText="Hủy"
          isLoading={isSubmitting}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirmAction}
        />
      </div>
    </div>
  );
};

