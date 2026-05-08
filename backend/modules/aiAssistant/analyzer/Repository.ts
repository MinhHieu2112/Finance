import transactionModel from '../../../models/Transaction';
import { Types } from 'mongoose';

class AnomalyRepository {
    // Tính toán giá trị chi tiêu trung bình của một danh mục trong khoảng thời gian nhất định.
    async getPastTransactionsAverage(userId: string, categoryId: string, days: number = 30) {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - days);

        return await transactionModel.aggregate([
            { 
                $match: { 
                    userId: new Types.ObjectId(userId.toString()),
                    type: 'expense',
                    date: { $gte: pastDate }
                } 
            },
            { $unwind: '$details' },
            { 
                $match: { 
                    'details.categoryId': new Types.ObjectId(categoryId.toString()) 
                } 
            },
            {
                $group: {
                    _id: null,
                    avgAmount: { 
                        $avg: { 
                            $multiply: [
                                { $cond: [{ $gt: ['$details.base_amount', 0] }, '$details.base_amount', '$details.amount'] }, 
                                '$details.quantity'
                            ] 
                        } 
                    },
                    count: { $sum: 1 }
                }
            }
        ]);
    }
}

export default new AnomalyRepository();
