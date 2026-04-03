import transactionModel from '../../../models/Transaction';
import { type transactionSchema } from '../../types/Transactions';

class transactionRepository {
	async listTransactions(userID: string): Promise<transactionSchema[]> {
		return transactionModel.find({ userID }).sort({ date: -1 });
	}
}

export default new transactionRepository();
