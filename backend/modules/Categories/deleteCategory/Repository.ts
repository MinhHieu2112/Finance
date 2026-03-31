import categoryModel from '../../../models/Category';

class categoryRepository {
	async deleteCategoryById(id: string) {
		return categoryModel.findOneAndDelete({ id });
	}
}

export default new categoryRepository();
