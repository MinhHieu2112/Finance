import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '../Button/Button';
import { Pencil, Trash2, X } from 'lucide-react';
import { ToastModal } from '../ToastModal/ToastModal';
import type { Category, CategoryManagerModalProps, CategoryType } from './types';

const CATEGORY_TYPE_LABEL: Record<CategoryType, string> = {
  income: 'Thu nhập',
  expense: 'Chi phí',
};

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
  const [error, setError] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<{ type: 'update' | 'delete'; categoryId: string } | null>(null);
  const [catalogFilterId, setCatalogFilterId] = useState('all');
  const [createCatalogId, setCreateCatalogId] = useState('');

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
    setError(null);
  };

  const cancelEdit = () => {
    setEditingCategoryId(null);
    setEditingName('');
    setEditingDescription('');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setError(null);
      setIsSubmitting(true);
      await onCreate({ name, description, type: activeType, catalogId: createCatalogId || undefined });
      resetCreateForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể tạo danh mục. Vui lòng thử lại.');
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

  const handleConfirmAction = async () => {
    if (!pendingAction) {
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);

      if (pendingAction.type === 'update') {
        await onUpdate(pendingAction.categoryId, { name: editingName, description: editingDescription });
        cancelEdit();
      } else {
        await onDelete(pendingAction.categoryId);
        if (editingCategoryId === pendingAction.categoryId) {
          cancelEdit();
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Không thể hoàn tất hành động. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
      setPendingAction(null);
    }
  };

  const isUpdateAction = pendingAction?.type === 'update';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl animate-fade-in-up max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={22} />
        </button>

        <h2 className="text-xl font-bold mb-5 text-gray-800">Quản lý Danh mục</h2>

        <div className="mb-4 inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-md ${activeType === 'expense' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            onClick={() => onTypeChange('expense')}
          >
            Chi phí
          </button>
          <button
            type="button"
            className={`px-3 py-1.5 text-sm rounded-md ${activeType === 'income' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}
            onClick={() => onTypeChange('income')}
          >
            Thu nhập
          </button>
        </div>

        <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* <div>
            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">View Catalog</p>
            <select
              value={catalogFilterId}
              onChange={(event) => setCatalogFilterId(event.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
            >
              <option value="all">All catalogs</option>
              {catalogOptions.map((option) => (
                <option key={option.catalogId} value={option.catalogId}>
                  {option.catalogName}
                </option>
              ))}
            </select>
          </div> */}
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <select
            value={createCatalogId}
            onChange={(event) => setCreateCatalogId(event.target.value)}
            className="md:col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none bg-white"
          >
            {!catalogOptions.length && <option value="">Không có danh mục nào</option>}
            {catalogOptions.map((option) => (
              <option key={option.catalogId} value={option.catalogId}>
                {option.catalogName}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tên danh mục"
            className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          {/* <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="md:col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          /> */}
          <div className="md:col-span-3">
            <Button type="submit" isLoading={isSubmitting}>Thêm Danh mục {CATEGORY_TYPE_LABEL[activeType]}</Button>
          </div>
        </form>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Danh mục chính</th>
                <th className="px-4 py-3">Tên</th>
                {/* <th className="px-4 py-3">Description</th> */}
                <th className="px-4 py-3 text-center">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedCategories.map((category) => {
                const isEditing = editingCategoryId === category._id;

                return (
                  <tr key={category._id}>
                    <td className="px-4 py-3 align-top text-gray-600">{category.catalogName || '-'}</td>
                    <td className="px-4 py-3 align-top">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />
                      ) : (
                        <span className="font-medium text-gray-800">{category.name}</span>
                      )}
                    </td>
                    {/* <td className="px-4 py-3 align-top">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editingDescription}
                          onChange={(e) => setEditingDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
                        />
                      ) : (
                        <span className="text-gray-600">{category.description || '-'}</span>
                      )}
                    </td> */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <Button type="button" variant="secondary" onClick={cancelEdit} disabled={isSubmitting}>Hủy</Button>
                            <Button type="button" onClick={handleSaveEdit} isLoading={isSubmitting}>Lưu</Button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 rounded-full"
                              title="Chỉnh sửa danh mục"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => requestDelete(category._id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                              title="Xóa danh mục"
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
                  <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                    No {CATEGORY_TYPE_LABEL[activeType].toLowerCase()} categories yet. Create your first one.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <ToastModal
          isOpen={Boolean(pendingAction)}
          type="confirm"
          title={isUpdateAction ? 'Confirm category edit' : 'Confirm category deletion'}
          message={isUpdateAction ? 'Do you want to save these category changes?' : 'This category will be deleted permanently.'}
          confirmText={isUpdateAction ? 'Save changes' : 'Delete'}
          cancelText="Cancel"
          isLoading={isSubmitting}
          onClose={() => setPendingAction(null)}
          onConfirm={handleConfirmAction}
        />

        <ToastModal
          isOpen={Boolean(error)}
          type="error"
          title="Category action failed"
          message={error || ''}
          onClose={() => setError(null)}
        />
      </div>
    </div>
  );
};
