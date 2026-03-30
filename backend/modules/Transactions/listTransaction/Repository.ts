import transactionModel from '../../../models/Transaction';

class transactionRepository {
	async listTransactions(userID: string) {
		return transactionModel.find({ userID }).sort({ date: -1 });
	}
}

export default new transactionRepository();
