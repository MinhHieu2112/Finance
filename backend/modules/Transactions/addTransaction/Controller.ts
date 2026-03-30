import transactionService from './Serviec';
import { type Request, type Response, type NextFunction } from 'express';
import AppError from '../../../utils/appError';

const addTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { description, amount, type, category, date } = req.body;
        const authUser = res.locals.authUser;

        const transaction = await transactionService.addTransaction({userID: authUser.id,
                                                                     description,
                                                                     amount,
                                                                     type,
                                                                     category,
                                                                     date});
        res.status(201).json({success: true, transaction});
    } catch (error) {
        next(error);
    }
}

export default addTransaction;