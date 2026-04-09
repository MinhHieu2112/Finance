import AppError from '../../../utils/appError';
import add_query_nlpRepository from './Repository';
import {FinanceIntentSchema} from '../../../utils/normalized';
import { GoogleGenAI, Type } from '@google/genai';
import { type IntentDetectionResult } from '../../types/aiAssistant';
import { Types } from 'mongoose';

class add_query_nlpService {

	private buildQuerryFilter(query: any) {
		const filter: any = {};

		if (query.type) {
			filter.type = query.type;
		}

		if (query.category_keywords?.length) {
			filter.details = {
				$elemMatch: {
					categoryName: {
						$in: query.category_keywords.map((k: string) => new RegExp(k, 'i')),
					},
				},
			};
		}

		if (query.time?.length) {
			const orConditions: any[] = [];

			query.time.forEach((t: any) => {
			t.months.forEach((month: number) => {
				const from = new Date(t.year, month - 1, 1);
				const to   = new Date(t.year, month, 1);

				orConditions.push({
				date: { $gte: from, $lt: to }
				});
			});
			});

			filter.$or = orConditions;
		}

		return filter;
	}

	async handlePrompt(userId: Types.ObjectId, data: any): Promise<any> {
		const intent = data?.intent;
		const transactions = Array.isArray(data?.transactions)
			? data.transactions
			: Array.isArray(data?.data?.transactions)
				? data.data.transactions
				: null;
		const queryPayload = data?.query ?? (intent === 'query' ? data?.data : null);

		if (intent === 'add' && transactions) {
			const results = await Promise.all(
			transactions.map(async (t: any) => {

				const details = await Promise.all(
					t.details.map(async (d: any) => {

						const categoryId = await add_query_nlpRepository.findCategoryByName(userId,
																							d.categoryName);

						if (!categoryId) {
							throw new AppError(`Category not found: ${d.categoryName}`, 404);
						}

						return {categoryId,
								categoryName: d.categoryName,
								quantity: d.quantity || 1,
								amount: d.amount,
								name: d.name || '',}
					})
				);

				const totalAmount = details.reduce((sum, d) => sum + (d.amount * d.quantity), 0);

				return add_query_nlpRepository.addTransaction({
					userId,
					description: t.description,
					type: t.type,
					frequency: t.frequency,
					date: t.date,
					total_amount: totalAmount,
					details,
				});
			})
		);

		return {
			intent: 'add',
			data: results,
		};
		} else if (intent === 'query' && queryPayload) {
			
			const query  = this.buildQuerryFilter(queryPayload);
			query.userId = userId;
			const result = await add_query_nlpRepository.queryTransaction(query);

			return {
				intent: 'query',
				data: result,
			};
		}

		throw new AppError('Invalid AI payload format', 400);
	}
}

export default new add_query_nlpService();
