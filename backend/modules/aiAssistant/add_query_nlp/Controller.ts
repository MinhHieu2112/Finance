import { type NextFunction, type Request, type Response } from 'express';
import AppError from '../../../utils/appError';
import orchestratorService from './Serviec';

const add_query_nlp = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser   = res.locals.authUser;
		const { prompt } = req.body as { prompt?: string };

		if (!prompt?.trim()) {
			throw new AppError('Prompt is required', 400);
		}

		const result = await orchestratorService.handlePrompt(authUser.id, prompt);

		res.status(200).json({
			success: true,
			result,
		});
	} catch (error) {
		next(error);
	}
};

export { add_query_nlp };
