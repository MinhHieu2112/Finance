import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { CategoryWithUserPayload } from './types';

class categoryRepository {
	async findByName(userId: Types.ObjectId, name: string) {
		return categoryModel.findOne({ userId, name });
	}

	async addCategory(data: CategoryWithUserPayload) {
		return categoryModel.create(data);
	}
}

export default new categoryRepository();
