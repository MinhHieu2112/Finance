import type { Category, CategoryType } from '../../types/Categories';

export type { Category, CategoryType };

export interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: Category[];
  activeType: CategoryType;
  onTypeChange: (type: CategoryType) => void;
  onClose: () => void;
  onCreate: (payload: { name: string; description: string; type: CategoryType; catalogId?: string }) => Promise<void>;
  onUpdate: (id: string, payload: { name: string; description: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
