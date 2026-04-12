import AppError from '../../../utils/appError';
import add_query_nlpRepository from './Repository';
import { Types } from 'mongoose';
import { FinancetSchema, QuerySchema } from "../../../utils/normalized"
import type { AIIntentPayload, 
			  AIIntentResult, 
			  AIQueryInput, 
			  AITransactionInput, 
			  AIDetailInput } from './types';

class add_query_nlpService {

	private buildQuerryFilter(query: AIQueryInput) {
		const filter: Record<string, unknown> = {};

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
			const orConditions: Array<{ date: { $gte: Date; $lt: Date } }> = [];

			query.time.forEach((t) => {
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

	async handlePrompt(userId: Types.ObjectId, data: AIIntentPayload): Promise<AIIntentResult> {
		if(!userId || !data) {
			throw new AppError('User ID and data are required', 400);
		}
		const intent = data.intent;
		
		if (intent === 'add') {
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
						t.details.map(async (d: AIDetailInput) => {
							const category = await add_query_nlpRepository.findCategoryByName(userId,
																								t.type,
																								d.categoryName);
							if (!category) {
								throw new AppError(`Category not found: ${d.categoryName}`, 404);
							}

							return {categoryId	: category._id,
									categoryName: category.name,
									quantity	: d.quantity,
									amount		: d.amount,
									name		: d.name}
						})
					);

					const totalAmount = details.reduce((sum, d) => sum + (d.amount * d.quantity), 0);

					return add_query_nlpRepository.addTransaction({userId		: userId,
																description	: t.description,
																type			: t.type,
																frequency	: t.frequency,
																date			: t.date, 
																total_amount : totalAmount,
																details		: details});
				})
			);

			return {
				intent: 'add',
				data: results,
			};

		} else if (intent === 'query') {
			const data_valid = QuerySchema.safeParse(data.data);

			if (!data_valid.success) {
				const errorMessage = data_valid.error.issues
					.map(issue => `${issue.path.join('.')}: ${issue.message}`)
					.join(', ');
				throw new AppError(`Invalid query data format: ${errorMessage}`, 400);
			}
			
			const query  = this.buildQuerryFilter(data.data as AIQueryInput);
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
