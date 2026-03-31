import transactionRepository from './Repository';
import AppError from '../../../utils/appError';
import { randomUUID } from 'node:crypto';
import categoryModel from '../../../models/Category';
import { TransactionFrequency, TransactionType } from '../../../models/Transaction';

class transactionService {
    async addTransaction(data: { userID     : string,
                                 description: string, 
                                 amount     : number, 
                                 type       : string, 
                                 category   : string, 
                                 frequency  : string,
                                 date       : string }) {

        const description = data.description?.trim();
        const type = data.type?.trim() as TransactionType;
        const category = data.category?.trim();
        const frequency = data.frequency?.trim() as TransactionFrequency;

        if (!data.userID ||
            !description ||
            data.amount === undefined ||
            data.amount === null ||
            !type ||
            !category ||
            !frequency ||
            !data.date) {
            throw new AppError('Missing required transaction fields', 400);
        }

        if (data.amount < 0) {
            throw new AppError('Amount must be greater than or equal to 0', 400);
        }

        if (!Object.values(TransactionType).includes(type)) {
            throw new AppError('Invalid transaction type', 400);
        }

        if (!Object.values(TransactionFrequency).includes(frequency)) {
            throw new AppError('Invalid transaction frequency', 400);
        }

        if (type === TransactionType.EXPENSE) {
            const existingCategory = await categoryModel.findOne({ name: category });
            if (!existingCategory) {
                throw new AppError('Expense category does not exist', 400);
            }
        }
        
        const transaction = await transactionRepository.addTransaction({id: randomUUID(),
                                                                        userID: data.userID,
                                                                        description,
                                                                        amount: data.amount,
                                                                        type,
                                                                        category,
                                                                        frequency,
                                                                        date: data.date,});

        return transaction;

    }
}

export default new transactionService()