import transactionService from './Serviec';
import { type Request, type Response, type NextFunction } from 'express';

const addTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { description, type, frequency, date, total_amount, details } = req.body;
        const authUser = res.locals.authUser;

        const transaction = await transactionService.addTransaction({userId: authUser.id,
                                                                     description,
                                                                     type,
                                                                     frequency,
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