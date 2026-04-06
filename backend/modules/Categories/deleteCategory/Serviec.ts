import AppError from '../../../utils/appError';
import categoryRepository from './Repository';
// import { toObjectId } from '../../../utils/objectId';
import { Types } from 'mongoose';

class categoryService {
	async deleteCategory(id: Types.ObjectId, userId: Types.ObjectId) {
		if (!id) {
			throw new AppError('Category id is required', 400);
		}

		if (!userId) {
			throw new AppError('User id is required', 400);
		}

		const deletedCategory = await categoryRepository.deleteCategoryById(id, userId);

		if (!deletedCategory) {
			throw new AppError('Category not found', 404);
		}

		return deletedCategory;
	}
}

export default new categoryService();
