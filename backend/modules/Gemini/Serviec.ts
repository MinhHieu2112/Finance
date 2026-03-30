import { GoogleGenAI } from '@google/genai';
import geminiRepository from './Repository';
import AppError from '../../utils/appError';

class geminiService {
	async getFinancialAdvice(userID: string) {
		const transactions = await geminiRepository.getRecentTransactions(100, userID);

        const apiKey = process.env.GEMINI_API_KEY
        if (!apiKey) {
			throw new AppError('Missing GEMINI_API_KEY in backend environment', 500);
        }

		if (transactions.length === 0) {
			return 'Chua co giao dich de phan tich. Hay them giao dich de nhan goi y tai chinh.';
		}

        let aiClient = new GoogleGenAI({ apiKey });
		return geminiRepository.generateAdvice(transactions, aiClient);
	}
}

export default new geminiService();
