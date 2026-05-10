import transactionModel from '../../../models/Transaction';
import { Types } from 'mongoose';

class summaryRepository {
    // Lấy toàn bộ giao dịch của người dùng trong khoảng thời gian nhất định (mặc định 6 tháng)
    async getTransactions(userId: Types.ObjectId, months: number = 6) {
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);

        return await transactionModel.find({
            userId,
            date: { $gte: fromDate }
        }).sort({ date: 1 }).lean();
    }
}

export default new summaryRepository();
