import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';

class add_query_nlpRepository {
    // Lấy danh sách tên tất cả danh mục của người dùng để cung cấp ngữ cảnh cho AI.
	async listCategoryNames(userId: Types.ObjectId) {
		const categories = await categoryModel.find({ userId })
											  .select('name -_id')
											  .lean<Array<{ name: string }>>();

		return categories.map(c => c.name);
	}
}
export default new add_query_nlpRepository();
