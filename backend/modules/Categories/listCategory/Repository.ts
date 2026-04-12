import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { CategoryListItem } from './types';

class categoryRepository {
	async listCategories(userId: Types.ObjectId): Promise<CategoryListItem[]> {
		return categoryModel
			.find({ userId })
			.populate({ path: 'catalogId', select: 'name', options: { lean: true } })
			.sort({ createdAt: -1 })
			.lean<CategoryListItem[]>();
	}
}

export default new categoryRepository();
