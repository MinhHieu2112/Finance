import transactionRepository from './Repository';
import { type transactionSchema } from '../../types/Transactions';

class transactionService {
	async listTransactions(userID: string): Promise<transactionSchema[]> {
		return transactionRepository.listTransactions(userID);
	}
}

export default new transactionService();
