import { type Request, type Response, type NextFunction } from 'express';
import transactionService from './Serviec';

const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

		await transactionService.deleteTransaction(transactionId);

		res.status(204).send();
	} catch (error) {
		next(error);
	}
};

export default deleteTransaction;
