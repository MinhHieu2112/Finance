import { type Request, type Response, type NextFunction } from 'express';
import transactionService from './Serviec';

const listTransaction = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const transactions = await transactionService.listTransactions();
		res.status(200).json({success: true, transactions});
	} catch (error) {
		next(error);
	}
};

export default listTransaction;
