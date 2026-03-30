import transactionRepository from './Repository';
import AppError from '../../../utils/appError';

class transactionService {
	async deleteTransaction(id	  : string, 
							userID: string) {
		if (!id || !userID) {
			throw new AppError('Transaction id and user id are required', 400);
		}

		const deletedTransaction = await transactionRepository.deleteTransactionById(id, userID);

		if (!deletedTransaction) {
			throw new AppError('Transaction not found', 404);
		}

		return deletedTransaction;
	}
}

export default new transactionService();
