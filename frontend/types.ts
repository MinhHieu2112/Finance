// Enum for Transaction Types (Money coming in vs going out)
export enum TransactionType {
  INCOME = 'income',
  EXPENSE = 'expense',
}

// Enum for Categories to keep data structured
export enum Category {
  FOOD = 'Food & Dining',
  TRANSPORT = 'Transportation',
  UTILITIES = 'Utilities',
  ENTERTAINMENT = 'Entertainment',
  SHOPPING = 'Shopping',
  HEALTH = 'Health',
  SALARY = 'Salary',
  INVESTMENT = 'Investment',
  OTHER = 'Other',
}

// The shape of a single Transaction object
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string;
}

// User object for authentication context
export interface User {
  id: string;
  username: string;
  email: string;
  token: string;
}
