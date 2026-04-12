import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';

class add_query_nlpRepository {
	async listCategoryNames(userId: Types.ObjectId) {
		const categories = await categoryModel.find({ userId })
											  .select('name -_id')
											  .lean<Array<{ name: string }>>();

		const normalized = categories
			.map((category) => category.name?.trim())
			.filter((name): name is string => Boolean(name));

		return Array.from(new Set(normalized));
	}
}
export default new add_query_nlpRepository();
