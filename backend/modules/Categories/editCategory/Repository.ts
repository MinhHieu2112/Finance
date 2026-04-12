import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { CategoryType, CategoryUpdatePayload } from '../Categories';

class categoryRepository {
	async findCategoryByIdAndUser(categoryId: Types.ObjectId, userId: Types.ObjectId) {
		return categoryModel.findOne({ _id: categoryId, userId })
							.select('_id type')
							.lean<{ _id: Types.ObjectId; type: CategoryType } | null>();
	}

	async findCategoryByName(userId: Types.ObjectId, type: CategoryType, name: string) {
		return categoryModel.findOne({ userId, type, name });
	}

	async editCategoryById(categoryId: Types.ObjectId, userId: Types.ObjectId, data: CategoryUpdatePayload) {
		return categoryModel.findOneAndUpdate({ _id: categoryId, 
											   	userId },
											    data,
											  { new: true, 
												runValidators: true });
	}
}

export default new categoryRepository();
