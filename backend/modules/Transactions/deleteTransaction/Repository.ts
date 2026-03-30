import transactionModel from '../../../models/Transaction';

class transactionRepository {
	async deleteTransactionById(id	  : string, 
								userID: string) {
		return transactionModel.findOneAndDelete({ id, userID });
	}
}

export default new transactionRepository();
