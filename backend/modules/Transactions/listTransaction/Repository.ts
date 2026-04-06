import transactionModel from '../../../models/Transaction';
import { type transactionSchema } from '../../types/Transactions';
import mongoose, { type Types } from 'mongoose';

class transactionRepository {
	async listTransactions(id: Types.ObjectId): Promise<transactionSchema[]> {
		return transactionModel.find({ userId: id }).sort({ date: -1 }).lean<transactionSchema[]>();
	}
}

export default new transactionRepository();
