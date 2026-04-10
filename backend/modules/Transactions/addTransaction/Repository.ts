import transactionModel from '../../../models/Transaction';
import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { transactionSchema } from './types';

class transactionRepository {
    async addTransaction(data: transactionSchema) {
        const transaction = await transactionModel.create(data);
        return transaction;
    }

    async findCategoryNameById(userId: Types.ObjectId, categoryId: Types.ObjectId) {
        return categoryModel.findOne({ _id: categoryId, userId })
            .select('name')
            .lean<{ name: string }>();
    }
}

export default new transactionRepository()