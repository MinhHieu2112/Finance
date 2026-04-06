import { type Request, type Response, type NextFunction } from 'express';
import transactionService from './Serviec';
import { Types } from 'mongoose';

const editTransaction = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { description, type, frequency, date, total_amount, details } = req.body;
		
		const transactionId = new Types.ObjectId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
        const authUser 		= res.locals.authUser;

		const transaction = await transactionService.editTransaction(transactionId, 
                                                                    authUser.id,
                                                                    {description,
                                                                     type,
																	 frequency,
																 	 date,
																 	 total_amount,
																 	 details,});

		res.status(200).json({success: true, transaction});
	} catch (error) {
		next(error);
	}
};

export default editTransaction;
