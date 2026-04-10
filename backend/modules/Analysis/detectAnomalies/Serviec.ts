import AppError from '../../../utils/appError';
import detectAnomaliesRepository from './Repository';
import type { AnalysisAnomaly, transactionSchema } from './types';
import { Types } from 'mongoose';

type normalizedExpensePoint = {
	date: Date;
	description: string;
	category: string;
	amount: number;
};

class detectAnomaliesService {
	private mean(values: number[]) {
		if (!values.length) {
			return 0;
		}
		return values.reduce((sum, value) => sum + value, 0) / values.length;
	}

	private stdDev(values: number[]) {
		if (values.length < 2) {
			return 0;
		}
		const avg      = this.mean(values);
		const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
		return Math.sqrt(variance);
	}

	private normalizeExpenses(transactions: transactionSchema[]) {
		const rows: normalizedExpensePoint[] = [];

		transactions
			.filter((transaction) => transaction.type === 'expense')
			.forEach((transaction) => {
				const transactionDate = transaction.date instanceof Date ? transaction.date : new Date(transaction.date);
				if (Number.isNaN(transactionDate.getTime())) {
					return;
				}

				transaction.details.forEach((detail) => {
					const amount = Number(detail.amount) || 0;
					if (amount <= 0) {
						return;
					}

					rows.push({
						date: transactionDate,
						description: transaction.description,
						category: detail.categoryName,
						amount,
					});
				});
			});

		return rows;
	}

	private detect(transactions: transactionSchema[]) {
		const expenses = this.normalizeExpenses(transactions);
		if (!expenses.length) {
			return [] as AnalysisAnomaly[];
		}

		const byCategory = new Map<string, number[]>();
		expenses.forEach((item) => {
			if (!byCategory.has(item.category)) {
				byCategory.set(item.category, []);
			}
			byCategory.get(item.category)!.push(item.amount);
		});

		const globalAmounts = expenses.map((item) => item.amount);
		const globalMean 	= this.mean(globalAmounts);
		const globalStd 	= this.stdDev(globalAmounts);

		return expenses
			.map((item) => {
				const categoryValues   = byCategory.get(item.category) || [];
				const useCategoryStats = categoryValues.length >= 3;
				const refMean 		   = useCategoryStats ? this.mean(categoryValues) : globalMean;
				const refStd 		   = useCategoryStats ? this.stdDev(categoryValues) : globalStd;
				const amount 		   = item.amount;

				let threshold = refMean + 2 * refStd;
				if (refStd === 0) {
					threshold = refMean * 1.8;
				}

				const isAnomaly = amount > threshold && amount > refMean * 1.4;
				if (!isAnomaly) {
					return null;
				}

				const ratio  = refMean > 0 ? amount / refMean : 0;
				const reason = ratio > 0
					? `About ${ratio.toFixed(2)}x higher than your average ${item.category} spending`
					: 'Unusually large transaction compared with your spending history';

				return {
					    date        : item.date,
					    description : item.description,
					    category    : item.category,
					    amount,
					    reason,};
			})
			.filter((item): item is AnalysisAnomaly => item !== null)
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 10);
	}

	async getDetectAnomalies(userId: Types.ObjectId) {
		if (!userId) {
			throw new AppError('User id is required for anomaly detection', 400);
		}
		const transactions = await detectAnomaliesRepository.getRecentTransactions(500, userId);
		return this.detect(transactions);
	}
}

export default new detectAnomaliesService();
