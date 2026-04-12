import { type Types } from 'mongoose';
import AppError from '../../../utils/appError';
import add_trans_by_receiptImgRepository from './Repository';
import { FinancetSchema } from "../../../utils/normalized"
import type { AIDetailInput, 
			  AIIntentPayload, 
			  AITransactionInput } from './types';

class add_trans_by_receiptImgService {
	async handleReceiptImage(userId: Types.ObjectId, 
							 data  : AIIntentPayload): Promise<unknown[]> {
		if (!userId || !data) {
			throw new AppError('User id and data are required', 400);
		}

		const data_valid = FinancetSchema.safeParse(data.data);
		if (!data_valid.success) {
			const errorMessage = data_valid.error.issues
				.map(issue => `${issue.path.join('.')}: ${issue.message}`)
				.join(', ');
			throw new AppError(`Invalid transaction data format: ${errorMessage}`, 400);
		}

		const transactions = data_valid.data.transactions as AITransactionInput[];
		
		const results = await Promise.all(
			transactions.map(async (t) => {
				const details = await Promise.all(
					(t.details || []).map(async (d: AIDetailInput) => {
						const category = await add_trans_by_receiptImgRepository.findCategoryByName(userId,
																									t.type,
																									d.categoryName);

						if (!category) {
							throw new AppError(`Category not found: ${d.categoryName}`, 404);
						}

						return {categoryId	: category._id,
								categoryName: category.name,
								quantity	: d.quantity,
								amount		: d.amount,
								name		: d.name,}
					})
				);

				const totalAmount = details.reduce((sum, d) => sum + (d.amount * d.quantity), 0);

				return {description	: t.description,
						type		: t.type,
						frequency	: t.frequency,
						date		: t.date,
						total_amount: totalAmount,
						details		: details,};
			})
		);
		return results;
	}
}

export default new add_trans_by_receiptImgService();
