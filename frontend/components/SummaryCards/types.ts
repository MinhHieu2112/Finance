import type { Transaction } from '../../types/Transactions';
import type { Debt } from '../../types/Debts';

export { TransactionType } from '../../types/Transactions';

export interface SummaryCardsProps {
  transactions: Transaction[];
  debts?: Debt[];
}
