import transactionModel from '../../../models/Transaction';
import categoryModel from '../../../models/Category';
import mongoose, { type Types } from 'mongoose';
import type { transactionSchema } from './types';
import type { TransactionType } from './types';

class transactionRepository {
    async addTransaction(data: transactionSchema) {
        const transaction = await transactionModel.create(data);
        return transaction;
    }

    async findCategoryNameById(userId: Types.ObjectId | string, categoryId: Types.ObjectId | string, type: TransactionType) {
        const objectIdUserId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        const objectIdCategoryId = typeof categoryId === 'string' ? new mongoose.Types.ObjectId(categoryId) : categoryId;
        return categoryModel.findOne({ _id: objectIdCategoryId, userId: objectIdUserId, type })
                            .select('name')
                            .lean<{ name: string }>();
    }

    async getCurrentBalance(userId: Types.ObjectId | string): Promise<number> {
        const objectIdUserId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        const result = await transactionModel.aggregate([
            { $match: { userId: objectIdUserId } },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'income'] }, '$total_amount', 0]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [{ $eq: ['$type', 'expense'] }, '$total_amount', 0]
                        }
                    }
                }
            }
        ]);

        if (result.length === 0) {
            return 0;
        }

        return result[0].totalIncome - result[0].totalExpense;
    }
}

export default new transactionRepository()