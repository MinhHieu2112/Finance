import categoryModel from '../../../models/Category';
import transactionModel from '../../../models/Transaction';
import { type transactionSchema } from '../../types/Transactions';

class add_query_nlpRepository {
	async listCategoryNames(userID: string) {
		const categories = await categoryModel.find({ userID })
			.select('name -_id')
			.lean<Array<{ name: string }>>();

		return categories
			.map((category) => category.name?.trim())
			.filter((name): name is string => Boolean(name));
	}

	async addTransaction(data: transactionSchema) {
		const transaction = await transactionModel.create(data);
		return transaction;
	}

	async queryTransaction(queryFilter: Record<string, unknown>,): Promise<transactionSchema[]> {
		return transactionModel.find(queryFilter)
			.sort({ date: -1 })
			.limit(2000)
			.select('id description amount type category frequency date -_id')
			.lean<transactionSchema[]>();
	}
}

export default new add_query_nlpRepository();
