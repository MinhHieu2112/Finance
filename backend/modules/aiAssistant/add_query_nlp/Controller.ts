import { type NextFunction, type Request, type Response } from 'express';
import add_query_nlpService from './Service';

// Xử lý yêu cầu trích xuất thông tin hoặc truy vấn dữ liệu từ câu lệnh ngôn ngữ tự nhiên.
const add_query_nlp = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser   = res.locals.authUser;
		const { data } = req.body;

		const result = await add_query_nlpService.handlePrompt(authUser.id, data);

		res.status(200).json({
			success: true,
			message: 'AI query handled successfully',
			result,
		});
	} catch (error) {
		next(error);
	}
};

export { add_query_nlp };
