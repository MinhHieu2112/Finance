import transactionRepository from './Repository';
import AppError from '../../../utils/appError';
import { Types } from 'mongoose';

class transactionService {
	// Thực hiện xóa giao dịch dựa trên ID và xác thực quyền sở hữu của người dùng.
	async deleteTransaction(id	  : Types.ObjectId,
							userId: Types.ObjectId) {
		const deletedTransaction = await transactionRepository.deleteTransactionById(id, userId);
		if (!deletedTransaction) {
			throw new AppError('Transaction not found', 404);
		}

		return deletedTransaction;
	}
}

export default new transactionService();
