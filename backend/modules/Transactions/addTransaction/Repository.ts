import transactionModel from '../../../models/Transaction';
import { type transactionSchema } from '../../types/Transactions';

class transactionRepository {
    async addTransaction(data: transactionSchema) {
        const transaction = await transactionModel.create(data);
        return transaction;
    }
}

export default new transactionRepository()