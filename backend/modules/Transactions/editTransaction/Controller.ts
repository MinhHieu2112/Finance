import { type Request, type Response, type NextFunction } from 'express';
import transactionService from './Serviec';

const editTransaction = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { description, amount, type, category, date } = req.body;
		const transactionId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;

		const transaction = await transactionService.editTransaction(transactionId, 
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
