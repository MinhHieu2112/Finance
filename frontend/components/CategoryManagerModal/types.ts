import type { Category } from '../../types/Categories';

export type { Category };

export interface CategoryManagerModalProps {
  isOpen: boolean;
  categories: Category[];
  onClose: () => void;
  onCreate: (payload: { name: string; description: string }) => Promise<void>;
  onUpdate: (id: string, payload: { name: string; description: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}
