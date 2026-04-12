import type { Transaction } from '../../types/Transactions';
import type { CategoryOption } from '../../types/Categories';

export { TransactionType } from '../../types/Transactions';

export interface TransactionListProps {
  transactions: Transaction[];
  categoryOptions: CategoryOption[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}
