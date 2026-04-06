import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';

class categoryRepository {
	async deleteCategoryById(categoryId: Types.ObjectId, userId: Types.ObjectId) {
		return categoryModel.findOneAndDelete({ _id: categoryId, userId });
	}
}

export default new categoryRepository();
