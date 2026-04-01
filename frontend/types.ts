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

// Category entity returned by backend API
export interface Category {
  id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

// The shape of a single Transaction object
export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  frequency: TransactionFrequency;
  date: string;
}

// User object for authentication context
export interface User {
  id: string;
  username: string;
  email: string;
  token: string;
}

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

export interface AnalysisAnomaly {
  id: string;
  date: string;
  description: string;
  category: string;
  amount: number;
  reason: string;
}

export interface AnalysisResult {
  trend: {
    monthlySeries: MonthlyPoint[];
    predictedNextMonthIncome: number;
    predictedNextMonthExpense: number;
    expenseTrend: 'up' | 'down' | 'stable';
  };
  savingsPlan: string[];
  anomalies: AnalysisAnomaly[];
}
