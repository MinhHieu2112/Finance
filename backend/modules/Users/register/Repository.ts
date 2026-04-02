import userModel from '../../../models/Users';
import categoryModel from '../../../models/Category';

type defaultCategoryData = {
	id: string;
	userID: string;
	name: string;
	description: string;
};

class authRepository {
	async findUserByEmail(email: string) {
		return userModel.findOne({ email });
	}

	async findUserByUsername(username: string) {
		return userModel.findOne({ username });
	}

	async createUser(data: { userID: string; username: string; email: string; password: string }) {
		return userModel.create(data);
	}

	async createDefaultCategories(data: defaultCategoryData[]) {
		return categoryModel.insertMany(data);
	}

	async deleteUserByUserID(userID: string) {
		return userModel.deleteOne({ userID });
	}
}

export default new authRepository();
