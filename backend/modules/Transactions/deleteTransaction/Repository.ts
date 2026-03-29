import transactionModel from '../../../models/Transaction';

class transactionRepository {
	async deleteTransactionById(id: string) {
		return transactionModel.findOneAndDelete({ id });
	}
}

export default new transactionRepository();
