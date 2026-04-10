import AppError from '../../../utils/appError';
import add_query_nlpRepository from './Repository';
import { FinancetSchema, QuerySchema } from '../../../utils/normalized';
import { FunctionCallingConfigMode, GoogleGenAI, Type } from '@google/genai';
import { Types } from 'mongoose';
import { readFile } from 'node:fs/promises';

class add_query_nlpService {
	private getTools() {
		return [
			{
				functionDeclarations: [
					{
						name: "addTransaction",
						description: "Add one or multiple financial transactions",
						parameters: {
							type: Type.OBJECT,
							properties: {
								transactions: {
									type: Type.ARRAY,
									items: {
										type: Type.OBJECT,
										properties: {
											type: { type: Type.STRING, enum: ["income", "expense"] },
											description: { type: Type.STRING },
											frequency: { 
												type: Type.STRING, 
												enum: ["weekly", "monthly", "yearly", "one-time"] 
											},
											date: { type: Type.STRING },
											details: {
												type: Type.ARRAY,
												items: {
													type: Type.OBJECT,
													properties: {
														name: { type: Type.STRING },
														categoryName: { type: Type.STRING },
														amount: { type: Type.NUMBER, minimum: 0 },
														quantity: { type: Type.NUMBER, minimum: 1 },
													},
													required: ["categoryName", "amount", "quantity", "name"]
												}
											}
										},
										required: ["description", "type", "date", "frequency", "details"]
									}
								}
							},
							required: ["transactions"]
						}
					},
					{
						name: "queryTransaction",
						description: "Query financial transactions",
						parameters: {
							type: Type.OBJECT,
							properties: {
								type: { 
									type: Type.STRING, 
									enum: ["income", "expense"] 
								},
								category_keywords: {
									type: Type.ARRAY,
									items: { type: Type.STRING }
								},
								time: {
									type: Type.ARRAY,
									items: {
										type: Type.OBJECT,
										properties: {
											months: {
												type: Type.ARRAY,
												items: { type: Type.NUMBER, minimum: 1, maximum: 12 },
											},
											year: { type: Type.NUMBER, minimum: 1900, maximum: 2100, },
										},
										required: ["year", "months"] 
									}
								}					
							},
							required: ["type", "category_keywords", "time"]
						}
					}
				]
			}
		];
	}

	private buildPrompt(text: string | null, categories: string[]) {
		const categoryList = categories.length ? categories.join(', ') : 'Other';
		const today = new Date().toISOString().slice(0, 10);
		if (text == null) {
			return [
				`You are a financial receipt parser for Vietnamese and English receipts.,
				Return valid JSON only. No markdown. No explanation.,
				Current Date: ${today},
				Choose function addTransaction with parameters:
				{
					"transactions": Array<{
						"type": "income" | "expense",
						"description": string,
						"frequency": "weekly" | "monthly" | "yearly" | "one-time", .default to one-time if not clear from prompt.
						"date": "YYYY-MM-DD",  Use Current Date if not clear from prompt.
						"details": Array<{
							"name": string,
							"categoryName": string,
							"quantity": number, .default to 1 if not clear from prompt.
							"amount": number, .default to total_amount if not clear from prompt or if only one item in details.
						}>,
					}>,
				}
				Rules:
				- must extract all transactions from receipt.
				- categoryName must match the nearest existing category: ${categoryList}
				- type defaults to expense if unclear.
				- frequency defaults to one-time if unclear.
				- date defaults to Current Date if unclear.
				- quantity defaults to 1 if unclear.
				- amount and must be plain numbers in VND (no currency symbols)`
			].join('\n');
		}
		return [
			`You are a finance intent classifier for Vietnamese and English prompts.
			Return valid JSON only. No markdown. No explanation.
			Prompt: "${text}"
			Current Date: ${today}			
			If intent is add, choose function addTransaction with parameters:
			{
				"transactions": Array<{
					"type": "income" | "expense",
					"description": string,
					"frequency": "weekly" | "monthly" | "yearly" | "one-time", .default to one-time if not clear from prompt.
					"date": "YYYY-MM-DD",  Use Current Date if not clear from prompt.
					"details": Array<{
						"name": string,
						"categoryName": string,
						"quantity": number, .default to 1 if not clear from prompt.
						"amount": number, .default to total_amount if not clear from prompt or if only one item in details.
					}>,
				}>,
			}
			If intent is query, choose function queryTransaction with parameters:
			{
				"query": {
				"type": "income" | "expense",
				"category_keywords": string[],
				"time": Array<{
						"year": number,
						"months": number[],
					}>,
				},
			}
			categoryName and category_keywords MUST match nearest existing category when possible: ${categoryList}
			Transaction and keys: description, type, frequency, date, details.
			Detail item keys: categoryName, quantity, amount, name.
			Query keys: type, category_keywords, time.
			Intent rules:
			- add: user is recording one or many transactions. if multiple, transactions must be an array with separate items.
			- query: user asks for filter data by category, time, or type.
			Time rules:
			- Use months as integer array 1..12.
			- Use year as 4-digit array.
			Add transaction coverage rules:
			- Support basic, multi-transaction, with (date, frequency, income+expense) mix, slang.
			- If the input contains a list, table, or multiple lines 
				→ you MUST extract ALL items.
			- If transactions have same date, merge into one transaction with multiple details. Or else keep them separate with their own date.
			- When user enter amounts with decimal points you must understand that these are thousands separators, not decimal points.
				→ Convert them to integers.
			- Understand shorthand: k=1,000; tr=1,000,000; cu=1,000,000.
			- Keep transactions as array even with one item.			
			Field defaults:
			- All fields MUST be filled. If not clear, use reasonable defaults as described above.`
		].join('\n');
	}

	async handlePrompt(userId: Types.ObjectId, prompt: string | null, file: string | undefined): Promise<unknown> {
		if (!userId) {
			throw new AppError('User id is required', 400);
		}		
		
		const tools  = this.getTools();
		const apiKey = process.env.GEMINI_API_KEY?.trim();

		if (!apiKey) {
			throw new AppError('AI service is not configured', 503);
		}

		const categories = await add_query_nlpRepository.listCategoryNames(userId);
		const ai = new GoogleGenAI({ apiKey: apiKey });
		let response;

		if (prompt) {
			if (!prompt) {
				throw new AppError('Prompt cannot be empty', 400);
			}
			response = await ai.models.generateContent({
				model: 'gemini-3.1-flash-lite-preview',
				contents: this.buildPrompt(prompt.trim(), categories),
				config: {
					// temperature: 0,
					// responseMimeType: 'application/json',
					tools: tools as any,
					toolConfig: {
						functionCallingConfig: {
							mode: FunctionCallingConfigMode.ANY,
							allowedFunctionNames: ["addTransaction", "queryTransaction"]
						},
					},
					systemInstruction: `
					- If the statement is NOT related to the main financial transaction (e.g., question, time request, chat), you are not allowed to execute the transaction.
						-> Please call the queryTransaction function with empty (null or null) parameters.`
				}
			});
		}
		else if (file) {
			if (!file) {
				throw new AppError('Receipt image file is required', 400);
			}
			const imageData = (await readFile(file)).toString('base64');
			if (!imageData) {
				throw new AppError('Receipt image is empty', 400);
			}
			response = await ai.models.generateContent({
				model: 'gemma-4-31b-it',
				contents: [{role : 'user',
							parts: [{ text		: this.buildPrompt(null, categories) },
									{ inlineData: {mimeType : "image/jpeg",
												   data		: imageData,}}]
				}],
				config: {
					// temperature: 0,
					// responseMimeType: 'application/json',
					tools: tools as any,
					toolConfig: {
						functionCallingConfig: {
							mode: FunctionCallingConfigMode.ANY,
							allowedFunctionNames: ["addTransaction", "queryTransaction"]
						},
					},
					systemInstruction: `
					- If the statement is NOT related to the main financial transaction (e.g., question, time request, chat), you are not allowed to execute the transaction.
						-> Please call the queryTransaction function with empty (null or null) parameters.`
				}
			});
		}
		if (!response) {
			throw new AppError('No response from AI', 502);
		}
		const functionCalls = response.functionCalls;

		if (!functionCalls || functionCalls.length === 0) {
			throw new AppError('AI did not return any function calls', 502);
		}

		const call = functionCalls[0];

		if (call.name === "addTransaction") {
			const normalized = FinancetSchema.safeParse(call.args);
			if (!normalized.success) {
				const errorMessage = normalized.error.issues
					.map(issue => `${issue.path.join('.')}: ${issue.message}`)
					.join(', ');
				throw new AppError(`Invalid data format: ${errorMessage}`, 400);
			}
			// console.log('Normalized addTransaction data:', JSON.stringify(normalized.data));
			if (prompt) {
				return { intent: "add", data: normalized.data };
			}
			return normalized.data;
		}
		else {
			const normalized = QuerySchema.safeParse(call.args);
			if (!normalized.success) {
				const errorMessage = normalized.error.issues
					.map(issue => `${issue.path.join('.')}: ${issue.message}`)
					.join(', ');
				throw new AppError(`Invalid data format: ${errorMessage}`, 400);
			}
			console.log('Normalized queryTransaction data:', JSON.stringify(normalized.data));
			return { intent: "query", data: normalized.data };
		}
	

	}
}

export default new add_query_nlpService();
