import transactionRepository from './Repository';
import AppError from '../../../utils/appError';

class transactionService {
	async editTransaction(id	: string,
						  userID: string,
						  data	: { description : string, 
									amount		: number, 
									type		: string, 
									category	: string, 
									date		: string }) {
		if (!id) {
			throw new AppError('Transaction id is required', 400);
		}

		if (!userID) {
			throw new AppError('Unauthorized', 401);
		}

		if (!data.description ||
			data.amount === undefined ||
			data.amount === null ||
			!data.type ||
			!data.category ||
			!data.date) {
			throw new AppError('Missing required transaction fields', 400);
		}

		if (data.amount < 0) {
			throw new AppError('Amount must be greater than or equal to 0', 400);
		}

		const updatedTransaction = await transactionRepository.editTransactionById(id, userID, data);

		if (!updatedTransaction) {
			throw new AppError('Transaction not found', 404);
		}

		return updatedTransaction;
	}
}

export default new transactionService();
