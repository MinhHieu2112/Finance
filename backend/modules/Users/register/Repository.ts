import userModel from '../../../models/Users';
import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import { CategorySchema } from '../../types/Category';

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

	async createDefaultCategories(data: CategorySchema[]) {
		return categoryModel.insertMany(data);
	}

	async deleteCategoriesByUserId(userId: Types.ObjectId) {
		return categoryModel.deleteMany({ userId });
	}

	async deleteUserById(userId: Types.ObjectId) {
		return userModel.findByIdAndDelete(userId);
	}
}

export default new authRepository();
