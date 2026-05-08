import transactionRepository from './Repository';
import type { transactionSchema } from './types';
import { Types } from "mongoose"

class transactionService {
	// Truy vấn danh sách giao dịch của người dùng từ repository.
	async listTransactions(id: Types.ObjectId): Promise<transactionSchema[]> {
		return transactionRepository.listTransactions(id);
	}
}

export default new transactionService();
