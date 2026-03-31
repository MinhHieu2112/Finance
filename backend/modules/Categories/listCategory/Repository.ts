import categoryModel from '../../../models/Category';

class categoryRepository {
	async listCategories() {
		return categoryModel.find({}).sort({ createdAt: -1 });
	}
}

export default new categoryRepository();
