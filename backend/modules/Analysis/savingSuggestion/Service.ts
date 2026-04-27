import type { AnalysisAnomaly, ForcastingTrendResult } from './types';

class savingSuggestionService {
	private mean(values: number[]) {
		if (!values.length) {
			return 0;
		}

		return values.reduce((sum, value) => sum + value, 0) / values.length;
	}

	buildSavingSuggestion(trend: ForcastingTrendResult, anomalies: AnalysisAnomaly[]) {
		const incomeSeries  = trend.monthlySeries.map((point) => point.income);
		const expenseSeries = trend.monthlySeries.map((point) => point.expense);

		const avgIncome      = this.mean(incomeSeries);
		const avgExpense     = this.mean(expenseSeries);
		const monthlySavings = avgIncome - avgExpense;
		const savingsRate    = avgIncome > 0 ? monthlySavings / avgIncome : 0;

		const tips: string[] = [];

		if (savingsRate < 0.1) {
			tips.push('low');
		} else if (savingsRate < 0.2) {
			tips.push('moderate');
		} else {
			tips.push('healthy');
		}
		return tips.slice(0, 4);
	}
}

export default new savingSuggestionService();
