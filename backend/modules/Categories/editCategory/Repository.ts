import categoryModel from '../../../models/Category';

class categoryRepository {
	async findByName(name: string) {
		return categoryModel.findOne({ name });
	}

	async editCategoryById(id: string, data: { name: string; description: string }) {
		return categoryModel.findOneAndUpdate({ id },
											  data,
											  { new: true, runValidators: true });
	}
}

export default new categoryRepository();
