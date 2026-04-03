import AppError from '../../../utils/appError';
import detectAnomaliesRepository from './Repository';
import { type transactionSchema } from '../../types/Transactions';
import { type AnalysisAnomaly } from '../../types/Analysis';

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

	private detect(transactions: transactionSchema[]) {
		const expenses = transactions.filter((transaction) => transaction.type === 'expense');
		if (!expenses.length) {
			return [] as AnalysisAnomaly[];
		}

		const byCategory = new Map<string, number[]>();
		expenses.forEach((transaction) => {
			if (!byCategory.has(transaction.category)) {
				byCategory.set(transaction.category, []);
			}
			byCategory.get(transaction.category)!.push(Number(transaction.amount) || 0);
		});

		const globalAmounts = expenses.map((transaction) => Number(transaction.amount) || 0);
		const globalMean 	= this.mean(globalAmounts);
		const globalStd 	= this.stdDev(globalAmounts);

		return expenses
			.map((transaction) => {
				const categoryValues   = byCategory.get(transaction.category) || [];
				const useCategoryStats = categoryValues.length >= 3;
				const refMean 		   = useCategoryStats ? this.mean(categoryValues) : globalMean;
				const refStd 		   = useCategoryStats ? this.stdDev(categoryValues) : globalStd;
				const amount 		   = Number(transaction.amount) || 0;

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
					? `About ${ratio.toFixed(2)}x higher than your average ${transaction.category} spending`
					: 'Unusually large transaction compared with your spending history';

				return {id          : transaction.id,
					    date        : transaction.date,
					    description : transaction.description,
					    category    : transaction.category,
					    amount,
					    reason,};
			})
			.filter((item): item is AnalysisAnomaly => item !== null)
			.sort((a, b) => b.amount - a.amount)
			.slice(0, 10);
	}

	async getDetectAnomalies(userID: string) {
		if (!userID) {
			throw new AppError('User id is required for anomaly detection', 400);
		}
		const transactions = await detectAnomaliesRepository.getRecentTransactions(500, userID);
		return this.detect(transactions);
	}
}

export default new detectAnomaliesService();
