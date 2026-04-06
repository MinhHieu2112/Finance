// Enum for Transaction Types (Money coming in vs going out)
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

export enum TransactionFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ONE_TIME = 'one-time',
}

export interface TransactionDetail {
  categoryId: string;
  categoryName: string;
  quantity: number;
  amount: number;
  name: string;
}

export type TransactionPayloadDetail = TransactionDetail;

export interface Transaction {
  _id: string;
  userId: string;
  description: string;
  type: TransactionType;
  frequency: TransactionFrequency;
  date: string;
  total_amount: number;
  details: TransactionDetail[];
  createdAt?: string;
  updatedAt?: string;
}

export interface TransactionPayload {
  description: string;
  type: TransactionType;
  frequency: TransactionFrequency;
  date: string;
  total_amount: number;
  details: TransactionPayloadDetail[];
}

export interface ListTransactionResponse {
  success: boolean;
  transactions: Transaction[];
}

export interface SaveTransactionResponse {
  success: boolean;
  transaction: Transaction;
}

export const getPrimaryCategoryName = (transaction: Transaction) => {
  return transaction.details[0]?.categoryName || 'Other';
};