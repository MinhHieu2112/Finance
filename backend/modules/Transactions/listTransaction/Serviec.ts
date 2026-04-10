import transactionRepository from './Repository';
import type { transactionSchema } from './types';
import { Types } from "mongoose"

class transactionService {
	async listTransactions(id: Types.ObjectId): Promise<transactionSchema[]> {
		return transactionRepository.listTransactions(id);
	}
}

export default new transactionService();
