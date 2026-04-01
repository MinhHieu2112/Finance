export interface AdviceTransaction {
	id: string;
	description: string;
	amount: number;
	type: string;
	category: string;
	frequency: string;
	date: string;
}

export interface MonthlyPoint {
	month: string;
	income: number;
	expense: number;
}

export interface ForcastingTrendResult {
	monthlySeries: MonthlyPoint[];
	predictedNextMonthIncome: number;
	predictedNextMonthExpense: number;
	expenseTrend: 'up' | 'down' | 'stable';
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
	trend: ForcastingTrendResult;
	savingsPlan: string[];
	anomalies: AnalysisAnomaly[];
}
