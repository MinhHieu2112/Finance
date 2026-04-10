import type { ListTransactionResponse, Transaction } from '../../types/Transactions';
import type { User } from '../../types/Users';

export interface MonthlyPoint {
  month: string;
  income: number;
  expense: number;
}

export interface AnalysisAnomaly {
  _id: string;
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


export type { ListTransactionResponse, Transaction, User };

export interface AnalysisPageProps {
  user: User;
}

export interface ForcastingTrendResponse {
  success: boolean;
  trend: AnalysisResult['trend'];
}

export interface SavingSuggestionResponse {
  success: boolean;
  savingsPlan: string[];
}

export interface DetectAnomaliesResponse {
  success: boolean;
  anomalies: AnalysisResult['anomalies'];
}

export type TrendDirection = 'up' | 'down' | 'stable';

export interface MetricDriver {
  category: string;
  changePercent: number;
  deltaAmount: number;
}

export interface SavingsSnapshot {
  rate: number | null;
  monthlySurplus: number;
  suggestedAllocation: number;
}

export interface SuggestionCard {
  headline: string;
  action: string;
}
