import type {
  Category,
  CategoryOption,
  ListCategoryResponse,
  SaveCategoryResponse,
} from '../../types/Categories';
import type {
  ListTransactionResponse,
  SaveTransactionResponse,
  Transaction,
  TransactionPayload,
} from '../../types/Transactions';
import type { User } from '../../types/Users';

export type {
  Category,
  CategoryOption,
  ListCategoryResponse,
  SaveCategoryResponse,
  ListTransactionResponse,
  SaveTransactionResponse,
  Transaction,
  TransactionPayload,
  User,
};

export interface DashboardPageProps {
  user: User;
}
