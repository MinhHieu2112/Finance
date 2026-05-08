import transactionService from './Service';
import { type Request, type Response, type NextFunction } from 'express';

// Tiếp nhận yêu cầu thêm giao dịch mới từ client và điều phối xử lý.
const addTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { description, type, frequency, currency, date, total_amount, details } = req.body;
        const authUser = res.locals.authUser;

        const transaction = await transactionService.addTransaction({userId: authUser.id,
                                                                     description,
                                                                     type,
                                                                     frequency,
                                                                     currency,
                                                                     date,
                                                                     total_amount,
                                                                     details});
        res.status(201).json({success: true,
                              message: 'Transaction added successfully',
                              transaction});
    } catch (error) {
        next(error);
    }
}

export default addTransaction;