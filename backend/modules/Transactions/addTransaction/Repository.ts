import transactionModel from '../../../models/Transaction';
import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { transactionSchema } from './types';
import type { TransactionType } from './types';

class transactionRepository {
    async addTransaction(data: transactionSchema) {
        const transaction = await transactionModel.create(data);
        return transaction;
    }

    async findCategoryNameById(userId: Types.ObjectId, categoryId: Types.ObjectId, type: TransactionType) {
        return categoryModel.findOne({ _id: categoryId, userId, type })
                            .select('name')
                            .lean<{ name: string }>();
    }
}

export default new transactionRepository()