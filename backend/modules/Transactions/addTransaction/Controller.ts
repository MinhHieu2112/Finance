import transactionService from './Serviec';
import { type Request, type Response, type NextFunction } from 'express';

const addTransaction = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { description, amount, type, category, date } = req.body;

        const transaction = await transactionService.addTransaction({description,
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