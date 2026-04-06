import AppError from '../../../utils/appError';
import add_query_nlpRepository from './Repository';
import {FinanceIntentSchema} from '../../../utils/normalized';
import { GoogleGenAI } from '@google/genai';
import { type IntentDetectionResult } from '../../types/aiAssistant';
import { Types } from 'mongoose';

class add_query_nlpService {
	private buildPrompt(text: string, categories: string[]) {
		const categoryList = categories.length ? categories.join(', ') : 'Other';
		const today = new Date().toISOString().slice(0, 10);

		return [
			`You are a finance intent classifier for Vietnamese and English prompts.
			Return valid JSON only. No markdown. No explanation.
			Prompt: "${text}"
			Current Date: ${today}
			Output schema:
			{,
			  "intent": "add" | "query",
			  "transactions": [
				{
			    "description": string,
				"type": "income" | "expense",			    
			    "frequency": "weekly" | "monthly" | "yearly" | "one-time", .default to one-time if not clear from prompt.
			    "date": Date, .Use Current Date if not clear from prompt.
				"details": [
					{
						"categoryName" : string,
						"quantity": number, .default to 1 if not clear from prompt.
						"amount": number, .default to total_amount if not clear from prompt or if only one item in details.
						"note": string
					}
				"total_amount": "number", .default to sum of details.amount if not clear from prompt or if multiple items in details.
			   },
			   ....], | null,
			  "query": {
			    "type": "income" | "expense",
			    "category_keywords": string[],
			    "time": [
					{
			    		"year": number,
						"months": number[],
					},
				....]
			  } | null,
			},
			Transaction item keys: description, total_amount, type, category, frequency, date.
			Query keys: type, category_keywords, time.
			Intent rules:
			- add: user is recording one or many transactions. if multiple, transactions must be an array with separate items.
			- query: user asks totals, filter, category analysis.
			Time rules:
			- Use months as integer array 1..12.
			- Use year as 4-digit array.
			Add coverage rules:
			- Support basic, multi-transaction, with time, frequency, income+expense mix, slang.
			- Understand shorthand: k=1,000; tr=1,000,000; cu=1,000,000.
			- Keep transactions as array even with one item.
			- Expense category should match nearest existing category when possible: ${categoryList}
			Field defaults:
			- For query intent, always return query object with all keys; use [] or null when missing.
			- For add intent, query must be null.
			- For query intent, transactions must be null.`
		].join('\n');
	}

	async detectIntent(userId: Types.ObjectId, prompt: string): Promise<IntentDetectionResult> {

		const categories = await add_query_nlpRepository.listCategoryNames(userId);
		const apiKey 	 = process.env.GEMINI_API_KEY?.trim();

		if (!apiKey) {
			throw new AppError('AI service is not configured', 503);
		}

		const client   = new GoogleGenAI({ apiKey });
		const response = await client.models.generateContent({
			model: 'gemma-4-31b-it',
			contents: this.buildPrompt(prompt, categories),
			config: {
				temperature: 0,
				responseMimeType: 'application/json',
			},
		});
		const rawText = response.text?.trim();

		if (!rawText) {
			throw new AppError('No response from AI', 502);
		}

		return JSON.parse(rawText) as IntentDetectionResult;

	}

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

	async handlePrompt(userId: Types.ObjectId, prompt: string): Promise<any> {
		const message = prompt.trim();
		if (!userId) {
			throw new AppError('User id is required', 400);
		}

		if (!message) {
			throw new AppError('Prompt is required', 400);
		}
		// const rawJson = `{
		// 				"intent": "query",
		// 				"transactions": null,
		// 				"query": {
		// 					"type": "expense",
		// 					"time": [
		// 					{
		// 						"year": 2025,
		// 						"months": [10, 11]
		// 					},
		// 					{
		// 						"year": 2024,
		// 						"months": [12]
		// 					}
		// 					]
		// 				}
		// 				}`;
		// const result 	 = 	JSON.parse(rawJson) as IntentDetectionResult;

		
		const result 	 = await this.detectIntent(userId, message);
		const normalized = FinanceIntentSchema.safeParse(result);
		
		// console.log('Raw AI response:', result);
		// console.log('Normalized AI response:', JSON.stringify(normalized, null, 2));

		if (normalized.success) {
			const payload = normalized.data;

			if (payload.intent === 'add' && payload.transactions) {
				const results = await Promise.all(
				payload.transactions.map(async (t) => {

					// map details
					const details = await Promise.all(
						t.details.map(async (d) => {

							const categoryId = await add_query_nlpRepository.findCategoryByName(userId,
																					  			d.categoryName);

							if (!categoryId) {
								throw new AppError(`Category not found: ${d.categoryName}`, 404);
							}

							return {categoryId,
									categoryName: d.categoryName,
									quantity: d.quantity || 1,
									amount: d.amount,
									note: d.note || '',}
						})
					);

					const totalAmount = details.reduce((sum, d) => sum + d.amount, 0);

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
			} else if (payload.intent === 'query' && payload.query) {
				
				const query  = this.buildQuerryFilter(payload.query);
				query.userId = userId;
				const result = await add_query_nlpRepository.queryTransaction(query);

				return {
					intent: 'query',
					data: result,
				};
			}
		} else { 
			const errorMessage = normalized.error.issues
										.map(issue => `${issue.path.join('.')}: ${issue.message}`)
										.join(", ");
			throw new AppError(`${errorMessage}`, 502); 
		}
	}
}

export default new add_query_nlpService();
