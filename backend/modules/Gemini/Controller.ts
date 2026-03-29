import { type Request, type Response, type NextFunction } from 'express';
import geminiService from './Serviec';

const getGeminiAdvice = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const advice = await geminiService.getFinancialAdvice();
		res.status(200).json({ success: true, advice });
	} catch (error) {
		next(error);
	}
};

export default getGeminiAdvice;
