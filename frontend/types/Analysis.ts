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
