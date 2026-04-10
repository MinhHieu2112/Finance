import type { CategoryOption } from '../../types/Categories';
import type { Transaction, TransactionPayload } from '../../types/Transactions';

export { TransactionFrequency, TransactionType } from '../../types/Transactions';

export type { CategoryOption, Transaction, TransactionPayload };

export interface TransactionFormProps {
  onSave: (transaction: TransactionPayload) => Promise<void> | void;
  onClose: () => void;
  categoryOptions: CategoryOption[];
  onManageCategories?: () => void;
  mode?: 'create' | 'edit';
  initialTransaction?: Transaction | null;
  initialPayload?: TransactionPayload | null;
}

export interface TransactionDetailInput {
  id: string;
  categoryId: string;
  quantity: string;
  amount: string;
  name: string;
}
