import transactionModel from '../../../models/Transaction';
import { Types } from 'mongoose';

class AnomalyRepository {
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
                    avgAmount: { $avg: { $multiply: ['$details.amount', '$details.quantity'] } },
                    count: { $sum: 1 }
                }
            }
        ]);
    }
}

export default new AnomalyRepository();
