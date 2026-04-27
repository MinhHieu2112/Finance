import transactionModel from '../../../models/Transaction';
import { Types } from 'mongoose';

class insightsRepository {
    async getRecentTransactions(userId: Types.ObjectId, months: number = 3) {
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);

        return await transactionModel.find({
            userId,
            date: { $gte: fromDate }
        }).sort({ date: -1 }).lean();
    }
}

export default new insightsRepository();
