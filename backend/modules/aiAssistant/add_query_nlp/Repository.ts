import categoryModel from '../../../models/Category';
import transactionModel from '../../../models/Transaction';
import type { transactionSchema } from './types';
import { type Types } from 'mongoose';
import type { AITransactionType } from '../aiAssistant';

class add_query_nlpRepository {
	async addTransaction(data: transactionSchema): Promise<transactionSchema> {
		const transaction = await transactionModel.create(data);
		return transaction;
	}

	async queryTransaction(queryFilter: Record<string, unknown>,): Promise<transactionSchema[]> {
		return transactionModel.find(queryFilter)
							   .sort({ date: -1 })
							   .limit(2000)
							   .select('_id userId description type frequency date total_amount details createdAt updatedAt')
							   .lean<transactionSchema[]>();
	}
	async findCategoryByName(userId: Types.ObjectId, type: AITransactionType, name: string) {
		const category = await categoryModel.findOne({ userId, type, name })
											.select('_id name')
											.lean<{ _id: Types.ObjectId; name: string }>();

		return category ?? null;
	}
}
export default new add_query_nlpRepository();
