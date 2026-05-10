export interface MonthlyPoint {
	month: string;
	income: number;
	expense: number;
}

export interface ForecastingTrendResult {
	monthlySeries: MonthlyPoint[];
	expenseTrend: 'up' | 'down' | 'stable';
	nextMonthForecast?: number;
}

export interface AnalysisAnomaly {
	_id: string;
	date: Date;
	description: string;
	category: string;
	amount: number;
	reason: string;
}

export interface AnalysisResult {
	trend: ForecastingTrendResult;
	savingsPlan: string[];
	anomalies: AnalysisAnomaly[];
}