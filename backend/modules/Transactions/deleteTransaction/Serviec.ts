import transactionRepository from './Repository';
import AppError from '../../../utils/appError';
import { Types } from 'mongoose';

class transactionService {
	async deleteTransaction(id	  : Types.ObjectId, 
							userId: Types.ObjectId) {
		if (!id || !userId) {
			throw new AppError('Transaction id and user id are required', 400);
		}

		const deletedTransaction = await transactionRepository.deleteTransactionById(id, userId);
		if (!deletedTransaction) {
			throw new AppError('Transaction not found', 404);
		}

		return deletedTransaction;
	}
}

export default new transactionService();
