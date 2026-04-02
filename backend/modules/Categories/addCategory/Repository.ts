import categoryModel from '../../../models/Category';

class categoryRepository {
	async findByName(userID: string, name: string) {
		return categoryModel.findOne({ userID, name });
	}

	async addCategory(data: { id: string; userID: string; name: string; description: string }) {
		return categoryModel.create(data);
	}
}

export default new categoryRepository();
