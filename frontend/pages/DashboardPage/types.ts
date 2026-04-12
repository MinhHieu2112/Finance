import type {
  Category,
  CategoryOption,
  CategoryType,
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
  CategoryType,
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
