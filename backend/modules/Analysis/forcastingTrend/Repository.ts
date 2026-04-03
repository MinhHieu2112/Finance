import transactionModel from '../../../models/Transaction';
import { type transactionSchema } from '../../types/Transactions';

class forcastingTrendRepository {
	async getRecentTransactions(limit: number, userID: string) {
		return transactionModel.find({ userID })
			                   .sort({ date: -1 })
			                   .limit(limit)
			                   .select('id description amount type category frequency date -_id')
			                   .lean<transactionSchema[]>();
	}
}

export default new forcastingTrendRepository();
