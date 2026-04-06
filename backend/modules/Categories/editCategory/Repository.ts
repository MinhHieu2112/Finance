import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';

class categoryRepository {
	async findByName(userId: Types.ObjectId, name: string) {
		return categoryModel.findOne({ userId, name });
	}

	async editCategoryById(categoryId: Types.ObjectId, userId: Types.ObjectId, data: { name: string; description: string }) {
		return categoryModel.findOneAndUpdate({ _id: categoryId, userId },
											  data,
											  { new: true, runValidators: true });
	}
}

export default new categoryRepository();
