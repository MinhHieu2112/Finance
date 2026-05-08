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
    // Tính toán giá trị trung bình của mảng số.
	private mean(values: number[]) {
		if (!values.length) {
			return 0;
		}
		return values.reduce((sum, value) => sum + value, 0) / values.length;
	}

    // Tính độ lệch chuẩn để đo lường mức độ biến động của dữ liệu.
	private stdDev(values: number[]) {
		if (values.length < 2) {
			return 0;
		}
		const avg      = this.mean(values);
		const variance = values.reduce((sum, value) => sum + (value - avg) ** 2, 0) / values.length;
		return Math.sqrt(variance);
	}

    // Chuẩn hóa dữ liệu chi tiêu từ danh sách giao dịch.
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
					const amount = Number(detail.base_amount || detail.amount) || 0;
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

    // Phân tích và phát hiện các giao dịch bất thường dựa trên thống kê.
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
					? `Cao hơn khoảng ${ratio.toFixed(2)} lần so với mức chi tiêu trung bình cho ${item.category}`
					: 'Giao dịch lớn bất thường so với lịch sử chi tiêu của bạn';

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

    // Lấy danh sách các giao dịch bất thường của một người dùng cụ thể.
	async getDetectAnomalies(userId: Types.ObjectId) {
		if (!userId) {
			throw new AppError('User id is required for anomaly detection', 400);
		}
		const transactions = await detectAnomaliesRepository.getRecentTransactions(500, userId);
		return this.detect(transactions);
	}
}

export default new detectAnomaliesService();
