// Enum for Transaction Types (Money coming in vs going out)
export enum TransactionType {
  INCOME  = 'income',
  EXPENSE = 'expense',
  DEBT    = 'debt',
  SAVINGS = 'savings',
}

export enum TransactionFrequency {
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  YEARLY = 'yearly',
  ONE_TIME = 'one-time',
}

export enum Currency {
  VND = 'VND',
  USD = 'USD',
  EUR = 'EUR',
  JPY = 'JPY',
  GBP = 'GBP',
}

export interface TransactionDetail {
  categoryId: string;
  categoryName: string;
  quantity: number;
  amount: number;
  base_amount?: number;
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
  currency: Currency;
  base_amount: number;
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
  currency: Currency;
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