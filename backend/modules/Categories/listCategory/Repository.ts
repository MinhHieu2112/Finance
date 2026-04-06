import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';

class categoryRepository {
	async listCategories(userId: Types.ObjectId) {
		return categoryModel.find({ userId }).sort({ createdAt: -1 });
	}
}

export default new categoryRepository();
