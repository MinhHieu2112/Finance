import { type Types } from 'mongoose';
import AppError from '../../../utils/appError';
import add_trans_by_receiptImgRepository from './Repository';
import type { AIDetailInput, AIIntentPayload, AITransactionInput } from './types';

class add_trans_by_receiptImgService {
	private resolveTransactions(data: AIIntentPayload): AITransactionInput[] | null {
		if (Array.isArray(data.transactions)) {
			return data.transactions;
		}

		if (typeof data.data === 'object' && data.data !== null) {
			const nestedTransactions = (data.data as { transactions?: AITransactionInput[] }).transactions;
			if (Array.isArray(nestedTransactions)) {
				return nestedTransactions;
			}
		}

		return null;
	}

	async handleReceiptImage(userId: Types.ObjectId, data: AIIntentPayload): Promise<unknown[]> {
		if (!userId) {
			throw new AppError('User id is required', 400);
		}
		

		const transactions = this.resolveTransactions(data);
		if (!transactions) {
			throw new AppError('Invalid AI payload format', 400);
		}
		
		const results = await Promise.all(
			transactions.map(async (t) => {

				const details = await Promise.all(
					(t.details || []).map(async (d: AIDetailInput) => {
						const quantity = Number(d.quantity) || 1;
						const amount = Number(d.amount) || 0;

						const categoryId = await add_trans_by_receiptImgRepository.findCategoryByName(userId,
																	d.categoryName);

						if (!categoryId) {
							throw new AppError(`Category not found: ${d.categoryName}`, 404);
						}

						return {categoryId,
								categoryName: d.categoryName,
								quantity,
								amount,
								name: d.name,}
					})
				);

				const totalAmount = details.reduce((sum, d) => sum + (d.amount * d.quantity), 0);
				const parsedDate = t.date ? new Date(t.date) : new Date();
				const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

				return {
					description: t.description || '',
					type: t.type || 'expense',
					frequency: t.frequency || 'one-time',
					date: safeDate,
					total_amount: totalAmount,
					details,
				};
			})
		);
		return results;
	}
}

export default new add_trans_by_receiptImgService();
