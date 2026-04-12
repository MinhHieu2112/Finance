import { type Request, type Response, type NextFunction } from 'express';
import add_trans_by_receiptImgService from './Serviec';

const add_trans_by_receiptImg = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser = res.locals.authUser;
		const { data } = req.body;		

		const result   = await add_trans_by_receiptImgService.handleReceiptImage(authUser.id, data);

		res.status(200).json({
			success: true,
			result: result,
		});
	} catch (error) {
		next(error);
	}
};

export { add_trans_by_receiptImg };
