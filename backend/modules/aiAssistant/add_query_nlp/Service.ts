import AppError from '../../../utils/appError';
import { Currency } from '../../types/Transactions';
import add_query_nlpRepository from './Repository';
import { Types } from 'mongoose';
import { FinancetSchema, QuerySchema } from "../../../utils/normalized";
import { convertToBase } from '../../../utils/currencyConverter';
import AIProviderService from '../MCP_tools/Service';
import type { AIQueryInput, AITransactionInput, AIDetailInput } from './types';

class add_query_nlpService {
	// Xây dựng bộ lọc truy vấn MongoDB dựa trên dữ liệu trích xuất từ AI.
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

	// Tích hợp xử lý ngôn ngữ NLP qua AI Provider kết hợp gọi Database
	async handlePrompt(userId: Types.ObjectId, prompt: string): Promise<unknown> {
		if(!userId) throw new AppError('Lỗi hệ thống: Thiếu User ID', 400);
		if(!prompt) throw new AppError('Vui lòng cung cấp văn bản yêu cầu', 400);

		const categoryList = await add_query_nlpRepository.listCategoryNames(userId);
		
		// 1. Gọi Dịch vụ AI Lõi (Provider)
		const aiResponse = await AIProviderService.processTextIntent(prompt, categoryList);
		
		const { intent, data, usage } = aiResponse;

		// 2. Xử lý logic Business (Database)
		if (intent === "add") {
			const normalized = FinancetSchema.safeParse(data);
			if (!normalized.success) {
				const errorMessage = normalized.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
				throw new AppError(`Định dạng dữ liệu không hợp lệ: ${errorMessage}`, 400);
			}

			const transactions = normalized.data.transactions as AITransactionInput[];
			const results = await Promise.all(
				transactions.map(async (t) => {
					const details = await Promise.all(
						t.details.map(async (d: AIDetailInput) => {
							const category = await add_query_nlpRepository.findCategoryByName(userId, t.type, d.categoryName);
							if (!category) throw new AppError(`Category not found: ${d.categoryName}`, 404);

							return {
								categoryId: category._id, 
								categoryName: category.name, 
								quantity: d.quantity,
								amount: d.amount, 
								base_amount: await convertToBase(d.amount, t.currency || Currency.VND, userId.toString()),
								name: d.name
							};
						})
					);

					const totalAmount = details.reduce((sum, d) => sum + (d.amount * d.quantity), 0);

					return add_query_nlpRepository.addTransaction({
						userId: userId,
						description: t.description,
						type: t.type,
						frequency: t.frequency,
						currency: t.currency || Currency.VND,
						base_amount: await convertToBase(totalAmount, t.currency || Currency.VND, userId.toString()),
						date: t.date, 
						total_amount: totalAmount,
						details: details
					});
				})
			);

			return { intent: 'add', data: results, usage };

		} else if (intent === "query") {
			const normalized = QuerySchema.safeParse(data);
			if (!normalized.success) {
				const errorMessage = normalized.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
				throw new AppError(`Định dạng dữ liệu không hợp lệ: ${errorMessage}`, 400);
			}
			
			const query  = this.buildQuerryFilter(normalized.data as AIQueryInput);
			query.userId = userId;
			const result = await add_query_nlpRepository.queryTransaction(query);

			return { intent: 'query', data: result, usage };
		}

		throw new AppError('Lỗi phân tích AI', 400);
	}
}

export default new add_query_nlpService();
