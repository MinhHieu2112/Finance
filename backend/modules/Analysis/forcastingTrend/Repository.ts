import transactionModel from '../../../models/Transaction';
import type { transactionSchema } from './types';
import { type Types } from 'mongoose';

class forcastingTrendRepository {
	async getRecentTransactions(limit: number, userId: Types.ObjectId) {
		return transactionModel.find({ userId })
			                   .sort({ date: -1 })
			                   .limit(limit)
							   .select('_id userId description type frequency date total_amount details createdAt updatedAt')
			                   .lean<transactionSchema[]>();
	}
}

export default new forcastingTrendRepository();
