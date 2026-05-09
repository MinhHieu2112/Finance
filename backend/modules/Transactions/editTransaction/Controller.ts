import { type Request, type Response, type NextFunction } from 'express';
import transactionService from './Service';
import { Types } from 'mongoose';

// Tiếp nhận yêu cầu cập nhật giao dịch từ client và điều phối xử lý.
const editTransaction = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { description, type, frequency, currency, date, total_amount, details } = req.body;
		
        const authUser 		= res.locals.authUser;
		const transactionId = new Types.ObjectId(req.params.id as string);

		const transaction = await transactionService.editTransaction(transactionId,
                                                                    authUser.id,
                                                                    {description,
                                                                     type,
																	 frequency,
                                                                     currency,
																 	 date,
																 	 total_amount,
																 	 details,});

		res.status(200).json({success: true,
							  message: 'Cập nhật giao dịch thành công',
							  transaction});
	} catch (error) {
		next(error);
	}
};

export default editTransaction;
