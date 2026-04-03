import AppError from '../../../utils/appError';
import forcastingTrendRepository from './Repository';
import { type transactionSchema } from '../../types/Transactions';
import { type ForcastingTrendResult, type MonthlyPoint } from '../../types/Analysis';

class forcastingTrendService {
	private monthKey(dateInput: string | Date): string | null {
		const raw = dateInput instanceof Date
			? dateInput.toISOString()
			: String(dateInput || '').trim();
		if (!raw) {
			return null;
		}

		const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
			? new Date(`${raw}T00:00:00`)
			: new Date(raw);

		if (Number.isNaN(date.getTime())) {
			return null;
		}

		const year  = date.getFullYear();
		const month = String(date.getMonth() + 1).padStart(2, '0');
		return `${year}-${month}`;
	}

	private mean(values: number[]) {
		if (!values.length) {
			return 0;
		}
		return values.reduce((sum, value) => sum + value, 0) / values.length;
	}

	private forecastWithLinearRegression(values: number[]) {
		if (!values.length) {
			return 0;
		}

		if (values.length === 1) {
			return Math.max(0, values[0]);
		}

		const n     = values.length;
		const xMean = (n - 1) / 2;
		const yMean = this.mean(values);

		let numerator   = 0;
		let denominator = 0;

		values.forEach((value, index) => {
			const xDiff  = index - xMean;
			numerator   += xDiff * (value - yMean);
			denominator += xDiff ** 2;
		});

		const slope     = denominator === 0 ? 0 : numerator / denominator;
		const intercept = yMean - slope * xMean;
		const predicted = intercept + slope * n;

		return Math.max(0, predicted);
	}

	private detectExpenseTrend(expenseSeries: number[]) {
		if (expenseSeries.length < 2) {
			return 'stable' as const;
		}

		const recent = expenseSeries.slice(-6);
		const n      = recent.length;
		const xMean  = (n - 1) / 2;
		const yMean  = this.mean(recent);

		let numerator   = 0;
		let denominator = 0;

		recent.forEach((value, index) => {
			const xDiff  = index - xMean;
			numerator   += xDiff * (value - yMean);
			denominator += xDiff ** 2;
		});

		const slope     = denominator === 0 ? 0 : numerator / denominator;
		const threshold = Math.max(50, yMean * 0.03);

		if (slope > threshold) {
			return 'up' as const;
		}

		if (slope < -threshold) {
			return 'down' as const;
		}

		return 'stable' as const;
	}

	private buildMonthlySeries(transactions: transactionSchema[]) {
		const map = new Map<string, { income: number; expense: number }>();

		transactions.forEach((transaction) => {
			const key = this.monthKey(transaction.date);
			if (!key) {
				return;
			}

			if (!map.has(key)) {
				map.set(key, { income: 0, expense: 0 });
			}

			const point = map.get(key)!;
			if (transaction.type === 'income') {
				point.income += Number(transaction.amount) || 0;
			} else {
				point.expense += Number(transaction.amount) || 0;
			}
		});

		return Array.from(map.entries())
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([month, values]) => ({ month, ...values })) as MonthlyPoint[];
	}

	private toForcastingTrend(monthlySeries: MonthlyPoint[]): ForcastingTrendResult {
		const recentMonthlySeries = monthlySeries.slice(-6);
		const incomeSeries        = recentMonthlySeries.map((point) => point.income);
		const expenseSeries       = recentMonthlySeries.map((point) => point.expense);

		return {
			monthlySeries: recentMonthlySeries,
			predictedNextMonthIncome: this.forecastWithLinearRegression(incomeSeries),
			predictedNextMonthExpense: this.forecastWithLinearRegression(expenseSeries),
			expenseTrend: this.detectExpenseTrend(expenseSeries),
		};
	}

	async getForcastingTrend(userID: string) {
		if (!userID) {
			throw new AppError('User id is required for forecasting trend', 400);
		}

		const transactions  = await forcastingTrendRepository.getRecentTransactions(500, userID);
		const monthlySeries = this.buildMonthlySeries(transactions);

		return this.toForcastingTrend(monthlySeries);
	}
}

export default new forcastingTrendService();
