import transactionRepository from './Repository';
import AppError from '../../../utils/appError';

class transactionService {
	async deleteTransaction(id: string) {
		if (!id) {
			throw new AppError('Transaction id is required', 400);
		}

		const deletedTransaction = await transactionRepository.deleteTransactionById(id);

		if (!deletedTransaction) {
			throw new AppError('Transaction not found', 404);
		}

		return deletedTransaction;
	}
}

export default new transactionService();
