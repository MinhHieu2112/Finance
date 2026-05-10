import AppError from '../../../utils/appError';
import { GoogleGenAI, Type, FunctionCallingConfigMode } from '@google/genai';

class AIProviderService {

	// Cấu hình các công cụ (tools) dành cho xử lý văn bản thuần túy (NLP)
	private getTextTools(categoryList: string[]) {
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
											type: { type: Type.STRING, enum: ["income", "expense", "debt", "savings"] },
											description: { type: Type.STRING },
											frequency: { type: Type.STRING, enum: ["weekly", "monthly", "yearly", "one-time"] },
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
								type: { type: Type.STRING, enum: ["income", "expense", "debt", "savings"] },
								category_keywords: {
									type: Type.ARRAY,
									items: { type: Type.STRING, enum: categoryList },
								},
								time: {
									type: Type.ARRAY,
									items: {
										type: Type.OBJECT,
										properties: {
											months: { type: Type.ARRAY, items: { type: Type.NUMBER, minimum: 1, maximum: 12 } },
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
						name: "none",
						description: "No relevant intent detected, or unable to parse the input.",
					}
				]
			}
		];
	}

	// Cấu hình các công cụ (tools) dành cho xử lý hóa đơn/hình ảnh (OCR)
	private getReceiptTools(categoryList: string[]) {
		return [
			{
				functionDeclarations: [
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
											type: { type: Type.STRING, enum: ["income", "expense", "debt", "savings"] },
											description: { type: Type.STRING },
											frequency: { type: Type.STRING, enum: ["weekly", "monthly", "yearly", "one-time"] },
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
						name: "none",
						description: "No relevant intent detected, or unable to parse the input.",
					}
				]
			}
		];
	}

	// Xây dựng câu lệnh (prompt) hướng dẫn AI phân tích ý định từ văn bản
	private buildTextPrompt(text: string, categoryList: string[]) {
		const today = new Date().toISOString().slice(0, 10);
		return [
			`Vai trò: Phân loại ý định tài chính VN & EN.
			Chỉ trả JSON.
			Prompt: "${text}"
			Ngày: ${today}			
			1. Nếu ý định 'add', gọi addTransaction:
			{
				"transactions": [{
					"type": "income"|"expense"|"debt"|"savings",
					"description": string,
					"frequency": "weekly"|"monthly"|"yearly"|"one-time" (Mặc định: "one-time"),
					"date": "YYYY-MM-DD" (Mặc định: ${today}),
					"details": [{
						"name": string,
						"categoryName": string (BẮT BUỘC KHỚP: ${categoryList}),
						"quantity": number (Mặc định: 1),
						"amount": number
					}]
				}]
			}
			2. Nếu ý định 'query' (tìm kiếm), gọi queryTransaction:
			{
				"type": "income"|"expense"|"debt"|"savings",
				"category_keywords": string[] (Khớp: ${categoryList}),
				"time": [{"year": number, "months": number[]}]
			}
			Luật dữ liệu:
			- add: đang ghi chép thu/chi. Tách nhiều giao dịch nếu cần.
			- query: đang hỏi lọc dữ liệu.
			- Đổi số tiền có chấm/phẩy thành số nguyên (10.000 -> 10000). Hiểu k=1000, tr/củ=1000000.
			- Luôn trả mảng transactions.`
		].join('\n');
	}

	// Xây dựng câu lệnh (prompt) hướng dẫn AI trích xuất thông tin từ ảnh hóa đơn
	private buildReceiptPrompt(categoryList: string[]) {
		const today = new Date().toISOString().slice(0, 10);
		return [
			`Vai trò: Chuyên gia trích xuất hóa đơn tài chính VN & EN.
			Chỉ trả về JSON hợp lệ. Không có markdown.
			Ngày hiện tại: ${today}
			Dùng hàm receiptParser với JSON:
			{
				"transactions": [{
					"type": "income" | "expense" | "debt" | "savings",
					"description": string,
					"frequency": "weekly"|"monthly"|"yearly"|"one-time" (Mặc định: "one-time"),
					"date": "YYYY-MM-DD" (Mặc định: ${today}),
					"details": [{
						"name": string,
						"categoryName": string (BẮT BUỘC KHỚP: ${categoryList}),
						"quantity": number (Mặc định: 1),
						"amount": number (Bằng tổng nếu chỉ có 1 mục)
					}]
				}]
			}
			Luật trích xuất:
			- Nếu có danh sách nhiều món, phải lấy TOÀN BỘ.
			- Gộp các giao dịch cùng ngày.
			- Số tiền có dấu chấm/phẩy phải chuyển thành số nguyên (VD: 10.000 -> 10000).
			- Nhận diện viết tắt: k=1000, tr/củ=1000000.
			- Bắt buộc điền đủ trường dữ liệu hợp lý.`
		].join('\n');
	}

	// Xử lý ý định người dùng từ câu lệnh văn bản (Text-to-Intent)
	async processTextIntent(prompt: string, categoryList: string[]) {
		const apiKey = process.env.GEMINI_API_KEY?.trim();
		if (!apiKey) throw new AppError('Dịch vụ AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY.', 503);

		const ai = new GoogleGenAI({ apiKey });
		const request = {
			model: 'gemini-3.1-flash-lite-preview',
			contents: this.buildTextPrompt(prompt.trim(), categoryList),
			config: {
				tools: this.getTextTools(categoryList) as any,
				toolConfig: {
					functionCallingConfig: {
						mode: FunctionCallingConfigMode.ANY,
						allowedFunctionNames: ['addTransaction', 'queryTransaction', 'none']
					}
				}
			}
		};

		const response = await ai.models.generateContent(request);
		if (!response) throw new AppError('Không nhận được phản hồi từ AI. Vui lòng thử lại sau.', 502);

		const functionCalls = response.functionCalls;
		if (!functionCalls || functionCalls.length === 0) {
			throw new AppError('AI không thể nhận diện được hành động hợp lệ từ nội dung của bạn.', 502);
		}

		const call = functionCalls[0];
		const usage = {
			inputTokens: response.usageMetadata?.promptTokenCount,
			outputTokens: response.usageMetadata?.candidatesTokenCount,
			totalTokens: response.usageMetadata?.totalTokenCount,
		};

		if (call.name === "none") {
			throw new AppError('AI không thể hiểu rõ ý định của bạn. Vui lòng nhập rõ ràng hơn (VD: Chi 50k ăn sáng).', 400);
		}

		return { intent: call.name === "addTransaction" ? "add" : "query", data: call.args, usage };
	}

	// Xử lý và trích xuất dữ liệu từ hình ảnh hóa đơn (OCR-to-Transaction)
	async processReceipt(file: Buffer, categoryList: string[]) {
		const apiKey = process.env.GEMINI_API_KEY?.trim();
		if (!apiKey) throw new AppError('Dịch vụ AI chưa được cấu hình. Vui lòng thêm GEMINI_API_KEY.', 503);

		const ai = new GoogleGenAI({ apiKey });
		const request = {
			model: 'gemini-2.5-flash',
			contents: [{
				role: 'user',
				parts: [
					{ text: this.buildReceiptPrompt(categoryList) },
					{ inlineData: { mimeType: 'image/jpeg', data: file.toString('base64') } }
				]
			}],
			config: {
				tools: this.getReceiptTools(categoryList) as any,
				toolConfig: {
					functionCallingConfig: {
						mode: FunctionCallingConfigMode.ANY,
						allowedFunctionNames: ['receiptParser', 'none']
					}
				}
			}
		};

		const response = await ai.models.generateContent(request);
		if (!response) throw new AppError('Không nhận được phản hồi từ AI đọc ảnh. Vui lòng thử lại.', 502);

		const functionCalls = response.functionCalls;
		if (!functionCalls || functionCalls.length === 0) {
			throw new AppError('AI không thể đọc được nội dung tài chính từ hóa đơn này.', 502);
		}

		const call = functionCalls[0];
		const usage = {
			inputTokens: response.usageMetadata?.promptTokenCount,
			outputTokens: response.usageMetadata?.candidatesTokenCount,
			totalTokens: response.usageMetadata?.totalTokenCount,
		};

		if (call.name === "none") {
			throw new AppError('AI không thể tìm thấy thông tin giao dịch rõ ràng trong hóa đơn này.', 400);
		}

		return { data: call.args, usage };
	}
}

export default new AIProviderService();
