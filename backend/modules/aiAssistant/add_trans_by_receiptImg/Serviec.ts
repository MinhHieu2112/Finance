import { readFile } from 'node:fs/promises';
import { GoogleGenAI } from '@google/genai';
import { type Types } from 'mongoose';
import AppError from '../../../utils/appError';
import add_trans_by_receiptImgRepository from './Repository';
import { TransactionSchema } from '../../../utils/normalized';
import { IntentTransactionPayload } from '../../types/aiAssistant';

class add_trans_by_receiptImgService {
	private buildPrompt(categories: string[]) {
		const categoryList = categories.length ? categories.join(', ') : 'Other';
		const today = new Date().toISOString().slice(0, 10);

		return [
				`You are a financial receipt parser for Vietnamese and English receipts.,
				Return valid JSON only. No markdown. No explanation.,
				Current Date: ${today},
				Output JSON schema:,
				{,
				  "description": string,,
				  "type": "income" | "expense",,
				  "frequency": "weekly" | "monthly" | "yearly" | "one-time",,
				  "date": "YYYY-MM-DD",,
				  "total_amount": number,,
				  "details": [,
				    {,
				      "categoryName": string,,
				      "quantity": number,,
				      "amount": number,,
				      "name": string,
				    },
				  ],
				},
				Rules:,
				- type defaults to expense if unclear.,
				- frequency defaults to one-time if unclear.,
				- date defaults to Current Date if unclear.,
				- quantity defaults to 1 if unclear.,
				- amount and total_amount must be plain numbers in VND (no currency symbols).,
				- total_amount should equal sum(details.amount).',
				- categoryName must match the nearest existing category: ${categoryList}`,
		].join('\n');
	}

	async handleReceiptImage(userId: Types.ObjectId, data: any): Promise<any> {
		if (!userId) {
			throw new AppError('User id is required', 400);
		}
		

		const transactions = Array.isArray(data?.transactions)
			? data.transactions
			: Array.isArray(data?.data?.transactions)
				? data.data.transactions
				: null;
		
		const results = await Promise.all(
			transactions.map(async (t: any) => {

				const details = await Promise.all(
					t.details.map(async (d: any) => {

						const categoryId = await add_trans_by_receiptImgRepository.findCategoryByName(userId,
																	d.categoryName);

						if (!categoryId) {
							throw new AppError(`Category not found: ${d.categoryName}`, 404);
						}

						return {categoryId,
								categoryName: d.categoryName,
								quantity: d.quantity || 1,
								amount: d.amount,
								name: d.name,}
					})
				);

				const totalAmount = details.reduce((sum, d) => sum + (d.amount * d.quantity), 0);

				return {
					description: t.description,
					type: t.type,
					frequency: t.frequency,
					date: t.date,
					total_amount: totalAmount,
					details,
				};
			})
		);
		return results;
	}
}

export default new add_trans_by_receiptImgService();
