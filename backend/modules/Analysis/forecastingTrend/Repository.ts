import transactionModel from '../../../models/Transaction';
import type { transactionSchema } from './types';
import { type Types } from 'mongoose';

class forecastingTrendRepository {
	async getRecentTransactions(limit: number, userId: Types.ObjectId) {
		// Truy vấn danh sách các giao dịch gần đây của người dùng để phục vụ dự báo.
		return transactionModel.find({ userId })
			                   .sort({ date: -1 })
			                   .limit(limit)
							   .select('_id userId description type frequency currency total_amount base_amount date details createdAt updatedAt')
			                   .lean<transactionSchema[]>();
	}
}

export default new forecastingTrendRepository();
