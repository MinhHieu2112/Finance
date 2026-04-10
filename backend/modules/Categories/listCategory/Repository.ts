import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { CategoryWithUserPayload } from './types';

class categoryRepository {
	async listCategories(userId: Types.ObjectId): Promise<CategoryWithUserPayload[]> {
		return categoryModel.find({ userId }).sort({ createdAt: -1 }).lean<CategoryWithUserPayload[]>();
	}
}

export default new categoryRepository();
