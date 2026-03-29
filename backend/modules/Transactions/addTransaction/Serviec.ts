import transactionRepository from './Repository';
import AppError from '../../../utils/appError';
import { randomUUID } from 'node:crypto';

class transactionService {
    async addTransaction(data: { description: string, 
                                 amount     : number, 
                                 type       : string, 
                                 category   : string, 
                                 date       : string }) {

        if (!data.description ||
            data.amount === undefined ||
            data.amount === null ||
            !data.type ||
            !data.category ||
            !data.date) {
            throw new AppError('Missing required transaction fields', 400);
        }

        if (data.amount < 0) {
            throw new AppError('Amount must be greater than or equal to 0', 400);
        }
        
        const transaction = await transactionRepository.addTransaction({id: randomUUID(),
                                                                        ...data,});

        return transaction;

    }
}

export default new transactionService()