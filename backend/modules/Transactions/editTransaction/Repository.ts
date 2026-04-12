import transactionModel from '../../../models/Transaction';
import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { transactionDetailSchema } from './types';
import type { TransactionType } from './types';

class transactionRepository {
	async findCategoryNameById(userId: Types.ObjectId, categoryId: Types.ObjectId, type: TransactionType) {
		return categoryModel.findOne({ _id: categoryId, userId, type })
							.select('name')
							.lean<{ name: string }>();
	}

	async editTransactionById(transactionId : Types.ObjectId,
							  userId        : Types.ObjectId,
							  data          : {description  : string;
											   type         : string;
											   frequency    : string;
											   date         : Date;
											   total_amount : number;
											   details      : transactionDetailSchema[];}): Promise<unknown> {
		return transactionModel.findOneAndUpdate({ _id: transactionId, userId },
												  data,
												{ new: true, runValidators: true });
	}
}

export default new transactionRepository();
