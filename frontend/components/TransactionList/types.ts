import type { Transaction } from '../../types/Transactions';

export { TransactionType } from '../../types/Transactions';

export interface TransactionListProps {
  transactions: Transaction[];
  categoryOptions: string[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
}
