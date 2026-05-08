import transactionModel from '../../../models/Transaction';
import type { transactionSchema } from './types';
import { type Types } from 'mongoose';

class transactionRepository {
    // Thực hiện truy vấn danh sách giao dịch từ cơ sở dữ liệu và sắp xếp theo ngày.
	async listTransactions(id: Types.ObjectId): Promise<transactionSchema[]> {
		return transactionModel.find({ userId: id }).sort({ date: -1 }).lean<transactionSchema[]>();
	}
}

export default new transactionRepository();
