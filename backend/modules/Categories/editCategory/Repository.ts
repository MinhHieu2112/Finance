import categoryModel from '../../../models/Category';

class categoryRepository {
	async findByName(userID: string, name: string) {
		return categoryModel.findOne({ userID, name });
	}

	async editCategoryById(id: string, userID: string, data: { name: string; description: string }) {
		return categoryModel.findOneAndUpdate({ id, userID },
											  data,
											  { new: true, runValidators: true });
	}
}

export default new categoryRepository();
