import categoryModel from '../../../models/Category';

class categoryRepository {
	async findByName(name: string) {
		return categoryModel.findOne({ name });
	}

	async addCategory(data: { id: string; name: string; description: string }) {
		return categoryModel.create(data);
	}
}

export default new categoryRepository();
