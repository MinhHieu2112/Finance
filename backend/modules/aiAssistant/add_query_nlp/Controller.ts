import { type NextFunction, type Request, type Response } from 'express';
import add_query_nlpService from './Serviec';

const add_query_nlp = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser   = res.locals.authUser;
		const { data } = req.body;

		const result = await add_query_nlpService.handlePrompt(authUser.id, data);

		res.status(200).json({
			success: true,
			result,
		});
	} catch (error) {
		next(error);
	}
};

export { add_query_nlp };
