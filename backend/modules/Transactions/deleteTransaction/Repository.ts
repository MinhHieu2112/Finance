import transactionModel from '../../../models/Transaction';
import { type Types } from 'mongoose';

class transactionRepository {
    // Thực hiện xóa bản ghi giao dịch trong cơ sở dữ liệu.
	async deleteTransactionById(transactionId: Types.ObjectId,
								userId: Types.ObjectId) {
		return transactionModel.findOneAndDelete({ _id: transactionId, userId });
	}
}

export default new transactionRepository();
