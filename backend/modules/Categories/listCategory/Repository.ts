import categoryModel from '../../../models/Category';

class categoryRepository {
	async listCategories(userID: string) {
		return categoryModel.find({ userID }).sort({ createdAt: -1 });
	}
}

export default new categoryRepository();
