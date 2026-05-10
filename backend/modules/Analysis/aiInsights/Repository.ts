import transactionModel from '../../../models/Transaction';
import debtModel, { DebtStatus } from '../../../models/Debt';
import { Types } from 'mongoose';

class insightsRepository {
    // Truy vấn danh sách giao dịch trong vài tháng gần nhất để phục vụ phân tích insights.
    async getRecentTransactions(userId: Types.ObjectId, months: number = 3) {
        const fromDate = new Date();
        fromDate.setMonth(fromDate.getMonth() - months);

        return await transactionModel.find({
            userId,
            date: { $gte: fromDate }
        }).sort({ date: -1 }).lean();
    }

    // Lấy tổng số nợ chưa trả của người dùng.
    async getTotalUnpaidDebt(userId: Types.ObjectId) {
        const result = await debtModel.aggregate([
            { $match: { userId, status: DebtStatus.UNPAID } },
            { $group: { _id: null, total: { $sum: "$amount" } } }
        ]);
        return result[0]?.total || 0;
    }

    // Tính toán số dư thực tế dựa trên toàn bộ lịch sử giao dịch.
    async getTotalBalance(userId: Types.ObjectId) {
        const result = await transactionModel.aggregate([
            { $match: { userId } },
            { $group: {
                _id: null,
                total: {
                    $sum: {
                        $cond: [
                            { $in: ["$type", ["income"]] }, "$total_amount",
                            { $subtract: [0, "$total_amount"] }
                        ]
                    }
                }
            }}
        ]);
        return result[0]?.total || 0;
    }
}

export default new insightsRepository();
