import { type Request, type Response, type NextFunction } from 'express';
import transactionService from './Serviec';
import { Types } from 'mongoose';

const deleteTransaction = async (req: Request, res: Response, next: NextFunction) => {
	try {
        const authUser 		= res.locals.authUser;
		const transactionId = new Types.ObjectId(req.params.id as string);

		await transactionService.deleteTransaction(transactionId, authUser.id);

		res.status(200).json({success: true,
							  message: 'Transaction deleted successfully'});
	} catch (error) {
		next(error);
	}
};

export default deleteTransaction;
