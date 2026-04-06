import transactionModel from '../../../models/Transaction';
import { type Types } from 'mongoose';

class transactionRepository {
	async deleteTransactionById(transactionId: Types.ObjectId,
								userId: Types.ObjectId) {
		return transactionModel.findOneAndDelete({ _id: transactionId, userId });
	}
}

export default new transactionRepository();
