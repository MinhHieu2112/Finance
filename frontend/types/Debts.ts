import { Transaction } from './Transactions';

export enum DebtStatus {
  UNPAID = 'unpaid',
  PAID = 'paid',
}

export interface Debt {
  _id: string;
  userId: string;
  transactionId: Transaction;
  amount: number;
  status: DebtStatus;
  dueDate?: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ListDebtResponse {
  status: string;
  results: number;
  debts: Debt[];
}
