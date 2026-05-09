import transactionModel from '../../../models/Transaction';
import categoryModel from '../../../models/Category';
import mongoose, { type Types } from 'mongoose';
import type { transactionSchema } from './types';
import type { TransactionType } from './types';

class transactionRepository {
    // Lưu thông tin giao dịch mới vào cơ sở dữ liệu.
    async addTransaction(data: transactionSchema) {
        const transaction = await transactionModel.create(data);
        return transaction;
    }

    // Tìm tên danh mục dựa trên ID, người dùng và loại giao dịch.
    async findCategoryNameById(userId: Types.ObjectId | string, categoryId: Types.ObjectId | string, type: TransactionType) {
        const objectIdUserId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        const objectIdCategoryId = typeof categoryId === 'string' ? new mongoose.Types.ObjectId(categoryId) : categoryId;
        return categoryModel.findOne({ _id: objectIdCategoryId, userId: objectIdUserId, type })
                            .select('name')
                            .lean<{ name: string }>();
    }

    // Tính toán số dư hiện tại của người dùng dựa trên tổng thu nhập và chi tiêu.
    async getCurrentBalance(userId: Types.ObjectId | string): Promise<number> {
        const objectIdUserId = typeof userId === 'string' ? new mongoose.Types.ObjectId(userId) : userId;
        const result = await transactionModel.aggregate([
            { $match: { userId: objectIdUserId } },
            {
                $group: {
                    _id: null,
                    totalIncome: {
                        $sum: {
                            $cond: [
                                { $in: ['$type', ['income', 'debt']] }, 
                                { $cond: [{ $gt: ['$base_amount', 0] }, '$base_amount', '$total_amount'] }, 
                                0
                            ]
                        }
                    },
                    totalExpense: {
                        $sum: {
                            $cond: [
                                { $in: ['$type', ['expense', 'savings']] }, 
                                { $cond: [{ $gt: ['$base_amount', 0] }, '$base_amount', '$total_amount'] }, 
                                0
                            ]
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