import transactionModel from '../../../models/Transaction';
import { type AdviceTransaction } from '../types';

class detectAnomaliesRepository {
	async getRecentTransactions(limit: number, userID: string) {
		return transactionModel.find({ userID })
			                   .sort({ date: -1 })
			                   .limit(limit)
			                   .select('id description amount type category frequency date -_id')
			                   .lean<AdviceTransaction[]>();
	}
}

export default new detectAnomaliesRepository();
