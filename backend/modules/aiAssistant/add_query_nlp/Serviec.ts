import AppError from '../../../utils/appError';
import add_query_nlpRepository from './Repository';
import { Types } from 'mongoose';
import type { AIDetailInput, AIIntentPayload, AIIntentResult, AIQueryInput, AITransactionInput } from './types';

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

	private resolveQueryPayload(data: AIIntentPayload): AIQueryInput | null {
		if (data.query) {
			return data.query;
		}

		if (data.intent === 'query' && typeof data.data === 'object' && data.data !== null) {
			const hasTransactions = Array.isArray((data.data as { transactions?: unknown }).transactions);
			if (!hasTransactions) {
				return data.data as AIQueryInput;
			}
		}

		return null;
	}

	async handlePrompt(userId: Types.ObjectId, data: AIIntentPayload): Promise<AIIntentResult> {
		const intent = data?.intent;
		const transactions = this.resolveTransactions(data);
		const queryPayload = this.resolveQueryPayload(data);

		if (intent === 'add' && transactions) {
			const results = await Promise.all(
			transactions.map(async (t) => {

				const details = await Promise.all(
					(t.details || []).map(async (d: AIDetailInput) => {
						const quantity = Number(d.quantity) || 1;
						const amount = Number(d.amount) || 0;

						const categoryId = await add_query_nlpRepository.findCategoryByName(userId,
																							d.categoryName);

						if (!categoryId) {
							throw new AppError(`Category not found: ${d.categoryName}`, 404);
						}

						return {categoryId,
								categoryName: d.categoryName,
								quantity,
								amount,
								name: d.name || '',}
					})
				);

				const totalAmount = details.reduce((sum, d) => sum + (d.amount * d.quantity), 0);
				const parsedDate = t.date ? new Date(t.date) : new Date();
				const safeDate = Number.isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

				return add_query_nlpRepository.addTransaction({
					userId,
					description: t.description || '',
					type: t.type || 'expense',
					frequency: t.frequency || 'one-time',
					date: safeDate,
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
