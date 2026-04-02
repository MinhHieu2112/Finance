import categoryModel from '../../../models/Category';

class categoryRepository {
	async deleteCategoryById(id: string, userID: string) {
		return categoryModel.findOneAndDelete({ id, userID });
	}
}

export default new categoryRepository();
