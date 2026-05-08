import transactionModel from '../../../models/Transaction';
import type { transactionSchema } from './types';
import { type Types } from 'mongoose';

class detectAnomaliesRepository {
    // Truy vấn danh sách các giao dịch gần đây của người dùng để phân tích bất thường.
	async getRecentTransactions(limit: number, userId: Types.ObjectId) {
		return transactionModel.find({ userId })
			                   .sort({ date: -1 })
			                   .limit(limit)
							   .select('_id userId description type frequency currency total_amount base_amount date details createdAt updatedAt')
			                   .lean<transactionSchema[]>();
	}
}

export default new detectAnomaliesRepository();
