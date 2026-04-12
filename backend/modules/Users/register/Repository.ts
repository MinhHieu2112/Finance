import userModel from '../../../models/Users';
import categoryModel from '../../../models/Category';
import catalogModel from '../../../models/Catalog';
import { type Types } from 'mongoose';
import type { UserCategorySchema } from './types';

class authRepository {
	async findUserByEmail(email: string) {
		return userModel.findOne({ email });
	}

	async findUserByUsername(username: string) {
		return userModel.findOne({ username });
	}

	async createUser(data: { username: string; email: string; password: string }) {
		return userModel.create(data);
	}

	async createDefaultCategories(data: UserCategorySchema[]) {
		return categoryModel.insertMany(data);
	}

	async findCatalogIdByTypeAndName(type: 'income' | 'expense', name: string) {
		const catalog = await catalogModel.findOne({ type, name })
			.select('_id')
			.lean<{ _id: Types.ObjectId } | null>();

		return catalog?._id ?? null;
	}

	async findFirstCatalogIdByType(type: 'income' | 'expense') {
		const catalog = await catalogModel.findOne({ type })
			.sort({ createdAt: 1 })
			.select('_id')
			.lean<{ _id: Types.ObjectId } | null>();

		return catalog?._id ?? null;
	}

	async deleteCategoriesByUserId(userId: Types.ObjectId) {
		return categoryModel.deleteMany({ userId });
	}

	async deleteUserById(userId: Types.ObjectId) {
		return userModel.findByIdAndDelete(userId);
	}
}

export default new authRepository();
