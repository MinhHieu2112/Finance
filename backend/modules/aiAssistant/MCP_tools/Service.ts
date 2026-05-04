import AppError from '../../../utils/appError';
import add_query_nlpRepository from './Repository';
import { FinancetSchema, QuerySchema } from '../../../utils/normalized';
import { FunctionCallingConfigMode, GoogleGenAI, Type } from '@google/genai';
import { Types } from 'mongoose';
import { readFile } from 'node:fs/promises';
import { en } from 'zod/locales';

class add_query_nlpService {
	private getTools(categoryList: string[]) {
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
														categoryName: { type: Type.STRING, enum: categoryList },
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
									items: { type: Type.STRING, enum: categoryList },
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
											year: { type: Type.NUMBER },
										},
										required: ["year", "months"] 
									}
								}					
							},
							required: ["type", "category_keywords", "time"]
						}
					},
					{
						name: "receiptParser",
						description: "Parse financial receipts and extract transaction information",
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
														categoryName: { type: Type.STRING, enum: categoryList },
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
				]
			}
		];
	}

	private buildPrompt(text: string | null, categoryList: string[]) {
		const today = new Date().toISOString().slice(0, 10);
		if (text === null) {
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
							"categoryName": string, (MUST match nearest existing category: ${categoryList})
							"quantity": number, .default to 1 if not clear from prompt.
							"amount": number, .default to total_amount if not clear from prompt or if only one item in details.
						}>,
					}>,
				}
				Transaction and keys: description, type, frequency, date, details.
				Detail item keys: categoryName, quantity, amount, name.
				receipt may contain one or many transactions. if multiple, transactions must be an array with separate items.
				Time rules:
				- Use months as integer array 1..12.
				- Use year as 4-digit array.
				Transaction coverage rules:
				- Support basic, multi-transaction, with (date, frequency, income+expense) mix, slang.
				- If the input contains a list, table, or multiple lines 
					→ you MUST extract ALL items.
				- If transactions have same date, merge into one transaction with multiple details. Or else keep them separate with their own date.
				- When receipt has amounts with decimal points you must understand that these are thousands separators, not decimal points.
					→ Convert them to integers.
				- Understand shorthand: k=1,000; tr=1,000,000; cu=1,000,000.
				- Keep transactions as array even with one item.			
				Field defaults:
				- All fields MUST be filled. If not clear, use reasonable defaults as described above.`
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
						"categoryName": string, (MUST match nearest existing category: ${categoryList})
						"quantity": number, .default to 1 if not clear from prompt.
						"amount": number, .default to total_amount if not clear from prompt or if only one item in details.
					}>,
				}>,
			}
			If intent is query, choose function queryTransaction with parameters:
			{
				"query": {
				"type": "income" | "expense",
				"category_keywords": string[], (MUST match nearest existing category: ${categoryList})
				"time": Array<{
						"year": number,
						"months": number[],
					}>,
				},
			}
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

	private buildRequest(prompt		 : string | null, 
						 file		 : Buffer | undefined, 
						 categoryList: string[]) 
	{
		const tools = this.getTools(categoryList);
		const isFile = !!file;

		return {
			model: isFile ? 'gemma-4-31b-it' : 'gemini-3.1-flash-lite-preview',
			contents: isFile
				? [{
					role: 'user',
					parts: [
						{ text: this.buildPrompt(null, categoryList) },
						{ inlineData: { mimeType: 'image/jpeg', data: file!.toString('base64') } }
					]
				}]
				: this.buildPrompt(prompt!.trim(), categoryList),
			config: {
				tools: tools as any,
				toolConfig: {
					functionCallingConfig: {
						mode: FunctionCallingConfigMode.ANY,
						allowedFunctionNames: isFile
							? ['receiptParser']
							: ['addTransaction', 'queryTransaction']
					}
				},
				...(!isFile && {
					systemInstruction: `
					- If the statement is NOT related to financial transaction,
					call queryTransaction with empty parameters.`
				})
			}
		};
	}	

	async handlePrompt(userId: Types.ObjectId, prompt: string | null, file: Buffer | undefined): Promise<unknown> {
		if (!userId) {
			throw new AppError('User id is required', 400);
		}		
		
		const categoryList = await add_query_nlpRepository.listCategoryNames(userId);
		const apiKey 	   = process.env.GEMINI_API_KEY?.trim();

		if (!apiKey) {
			throw new AppError('AI service is not configured', 503);
		}
		
		if (!prompt && !file) {
			throw new AppError('Prompt or file is required', 400);
		}
		
		const ai 	   = new GoogleGenAI({ apiKey: apiKey });
		const request  = this.buildRequest(prompt, file, categoryList);
		const response = await ai.models.generateContent(request);

		if (!response) {
			throw new AppError('No response from AI', 502);
		}
		
		const functionCalls = response.functionCalls;

		if (!functionCalls || functionCalls.length === 0) {
			throw new AppError('AI did not return any function calls', 502);
		}

		const call = functionCalls[0];

		console.log("Input Tokens (Prompt):", response.usageMetadata?.promptTokenCount);
		console.log("Output Tokens (Function Call):", response.usageMetadata?.candidatesTokenCount);
		console.log("Total Tokens:", response.usageMetadata?.totalTokenCount);
		const usage = {
			inputTokens: response.usageMetadata?.promptTokenCount,
			outputTokens: response.usageMetadata?.candidatesTokenCount,
			totalTokens: response.usageMetadata?.totalTokenCount,
		};
		
		if (call.name === "addTransaction" || call.name === "receiptParser") {
			const normalized = FinancetSchema.safeParse(call.args);
			if (!normalized.success) {
				const errorMessage = normalized.error.issues
				.map(issue => `${issue.path.join('.')}: ${issue.message}`)
				.join(', ');
				throw new AppError(`Invalid data format: ${errorMessage}`, 400);
			}			
			return { intent: "add", 
					 data: normalized.data, 
					 usage
					};
			
		}
		else {
			const normalized = QuerySchema.safeParse(call.args);
			if (!normalized.success) {
				const errorMessage = normalized.error.issues
				.map(issue => `${issue.path.join('.')}: ${issue.message}`)
				.join(', ');
				throw new AppError(`Invalid data format: ${errorMessage}`, 400);
			}
			return { intent: "query", 
					 data: normalized.data, 
					 usage
					};
		}	

	}
}

export default new add_query_nlpService();
