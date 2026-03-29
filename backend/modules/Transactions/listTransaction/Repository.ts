import transactionModel from '../../../models/Transaction';

class transactionRepository {
	async listTransactions() {
		return transactionModel.find().sort({ date: -1 });
	}
}

export default new transactionRepository();
