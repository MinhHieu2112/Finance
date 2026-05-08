import transactionModel from '../../../models/Transaction';
import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { transactionDetailSchema } from './types';
import type { TransactionType } from './types';

class transactionRepository {
    // Truy vấn tên danh mục để đảm bảo tính nhất quán của dữ liệu.
	async findCategoryNameById(userId: Types.ObjectId, categoryId: Types.ObjectId, type: TransactionType) {
		return categoryModel.findOne({ _id: categoryId, userId, type })
							.select('name')
							.lean<{ name: string }>();
	}

    // Cập nhật dữ liệu giao dịch trong cơ sở dữ liệu.
	async editTransactionById(transactionId : Types.ObjectId,
							  userId        : Types.ObjectId,
							  data          : {description  : string;
											   type         : string;
											   frequency    : string;
											   currency     : string;
											   date         : Date;
											   total_amount : number;
											   details      : transactionDetailSchema[];
											   base_amount  : number;}): Promise<unknown> {
		return transactionModel.findOneAndUpdate({ _id: transactionId, userId },
												  data,
												{ new: true, runValidators: true });
	}
}

export default new transactionRepository();
