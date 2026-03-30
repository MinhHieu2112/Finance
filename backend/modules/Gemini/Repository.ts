import { GoogleGenAI } from '@google/genai';
import transactionModel from '../../models/Transaction';

class geminiRepository {
	async getRecentTransactions(limit: number, userID: string) {
		return transactionModel.find({ userID })
			.sort({ date: -1 })
			.limit(limit)
			.select('description amount type category date -_id')
			// .lean<AdviceTransaction[]>();
	}

	async generateAdvice(transactions: any, aiClient: GoogleGenAI) {
		const transactionSummary = JSON.stringify(transactions);

		const prompt = `You are a friendly personal finance advisor.
                        Here is my recent transaction history as JSON: ${transactionSummary}

                        Please provide:
                        1. A short summary of spending habits.
                        2. Three practical tips to improve savings or reduce unnecessary costs.

                        Keep the tone encouraging and professional.
                        Respond in Vietnamese.
                        Use simple bullet points or markdown.
                        `;

		const response = await aiClient.models.generateContent({model: 'gemini-3-flash-preview',
			                                                    contents: prompt,});

		return response;
	}
}

export default new geminiRepository();
