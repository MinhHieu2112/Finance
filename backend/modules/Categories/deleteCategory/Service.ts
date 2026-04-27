import AppError from '../../../utils/appError';
import categoryRepository from './Repository';
import { Types } from 'mongoose';

class categoryService {
	async deleteCategory(categoryId: string, userId: Types.ObjectId) {
		if (!categoryId || !userId) {
			throw new AppError('Category id and user id are required', 400);
		}

		if (!Types.ObjectId.isValid(categoryId)) {
			throw new AppError('Invalid category id', 400);
		}

		const objectId = new Types.ObjectId(categoryId);

		const deletedCategory = await categoryRepository.deleteCategoryById(objectId, userId);

		if (!deletedCategory) {
			throw new AppError('Category not found', 404);
		}

		return deletedCategory;
	}
}

export default new categoryService();
