import React, { useMemo, useState } from 'react';
import { Category } from '../../types/Categories';
import { Button } from '../Button/Button';
import { Pencil, Trash2, X } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onCreate: (payload: { name: string; description: string }) => Promise<void>;
  onUpdate: (id: string, payload: { name: string; description: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  categories,
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

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name, 'en'));
  }, [categories]);

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
      await onCreate({ name, description });
      resetCreateForm();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingCategoryId) {
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await onUpdate(editingCategoryId, { name: editingName, description: editingDescription });
      cancelEdit();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to update category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) {
      return;
    }

    try {
      setError(null);
      setIsSubmitting(true);
      await onDelete(id);
      if (editingCategoryId === id) {
        cancelEdit();
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to delete category. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl p-6 relative shadow-2xl animate-fade-in-up max-h-[90vh] overflow-auto">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600" aria-label="Close">
          <X size={22} />
        </button>

        <h2 className="text-xl font-bold mb-5 text-gray-800">Manage Categories</h2>

        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="md:col-span-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"
          />
          <div className="md:col-span-3">
            <Button type="submit" isLoading={isSubmitting}>Add Category</Button>
          </div>
        </form>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left text-gray-700">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedCategories.map((category) => {
                const isEditing = editingCategoryId === category._id;

                return (
                  <tr key={category._id}>
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
                    <td className="px-4 py-3 align-top">
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
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        {isEditing ? (
                          <>
                            <Button type="button" variant="secondary" onClick={cancelEdit} disabled={isSubmitting}>Cancel</Button>
                            <Button type="button" onClick={handleSaveEdit} isLoading={isSubmitting}>Save</Button>
                          </>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => startEdit(category)}
                              className="text-gray-400 hover:text-indigo-500 transition-colors p-2 hover:bg-indigo-50 rounded-full"
                              title="Edit category"
                            >
                              <Pencil size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(category._id)}
                              className="text-gray-400 hover:text-red-500 transition-colors p-2 hover:bg-red-50 rounded-full"
                              title="Delete category"
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
                  <td colSpan={3} className="px-4 py-8 text-center text-gray-500">
                    No categories yet. Create your first category.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
