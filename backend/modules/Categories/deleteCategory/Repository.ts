import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { CategoryWithUserPayload } from './types';

class categoryRepository {
	async deleteCategoryById(categoryId: Types.ObjectId, userId: Types.ObjectId): Promise<CategoryWithUserPayload | null> {
		return categoryModel.findOneAndDelete({ _id: categoryId, userId })
							.lean<CategoryWithUserPayload | null>();
	}
}

export default new categoryRepository();
