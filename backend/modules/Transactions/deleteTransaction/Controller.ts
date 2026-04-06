import { type Request, type Response, type NextFunction } from 'express';
import transactionService from './Serviec';
import { Types } from 'mongoose';

const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const transactionId = new Types.ObjectId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const authUser 		= res.locals.authUser;

		await transactionService.deleteTransaction(transactionId, authUser.id);

		res.status(204).send();
	} catch (error) {
		next(error);
	}
};

export default deleteTransaction;
