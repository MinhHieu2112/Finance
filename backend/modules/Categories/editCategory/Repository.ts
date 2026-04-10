import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { CategoryPayload } from './types';

class categoryRepository {
	async findByName(userId: Types.ObjectId, name: string) {
		return categoryModel.findOne({ userId, name });
	}

	async editCategoryById(categoryId: Types.ObjectId, userId: Types.ObjectId, data: CategoryPayload) {
		return categoryModel.findOneAndUpdate({ _id: categoryId, userId },
											  data,
											  { new: true, runValidators: true });
	}
}

export default new categoryRepository();
