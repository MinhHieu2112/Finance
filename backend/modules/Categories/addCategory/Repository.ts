import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';

class categoryRepository {
	async findByName(userId: Types.ObjectId, name: string) {
		return categoryModel.findOne({ userId, name });
	}

	async addCategory(data: { userId: Types.ObjectId; name: string; description: string }) {
		return categoryModel.create(data);
	}
}

export default new categoryRepository();
