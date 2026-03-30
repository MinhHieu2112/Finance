import { type Request, type Response, type NextFunction } from 'express';
import transactionService from './Serviec';
import AppError from '../../../utils/appError';

const editTransaction = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { description, amount, type, category, date } = req.body;
		
		const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
        const authUser 		= res.locals.authUser;

		const transaction = await transactionService.editTransaction(transactionId, 
                                                                    authUser.id,
                                                                    {description,
                                                                     amount,
                                                                     type,
                                                                     category,
                                                                     date,});

		res.status(200).json({success: true, transaction});
	} catch (error) {
		next(error);
	}
};

export default editTransaction;
