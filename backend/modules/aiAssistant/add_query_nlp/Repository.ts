import categoryModel from '../../../models/Category';
import transactionModel from '../../../models/Transaction';
import { type transactionSchema } from '../../types/Transactions';
import { type Types } from 'mongoose';

class add_query_nlpRepository {
	async listCategoryNames(userId: Types.ObjectId) {
		const categories = await categoryModel.find({ userId })
			.select('name -_id')
			.lean<Array<{ name: string }>>();

		return categories
			.map((category) => category.name?.trim())
			.filter((name): name is string => Boolean(name));
	}

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
	async findCategoryByName(userId: Types.ObjectId, name: string) {
		const category = await categoryModel.findOne({ userId, name })
			.select('_id')
			.lean<{ _id: Types.ObjectId }>();

		return category?._id ?? null;
	}
}
export default new add_query_nlpRepository();
