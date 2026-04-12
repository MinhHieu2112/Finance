import AppError from '../../../utils/appError';
import categoryRepository from './Repository';
// import { toObjectId } from '../../../utils/objectId';
import { Types } from 'mongoose';
import type { CategoryUpdatePayload } from './types';

class categoryService {
	async editCategory(categoryId: string, userId: Types.ObjectId, data: CategoryUpdatePayload) {
		const name = data.name.trim();

		if (!categoryId || !userId || !name) {
			throw new AppError('Category id, user id, and name are required', 400);
		}
		if (!Types.ObjectId.isValid(categoryId)) {
			throw new AppError('Invalid category id', 400);
		}

		const objectId = new Types.ObjectId(categoryId);

		const currentCategory = await categoryRepository.findCategoryByIdAndUser(objectId, userId);
		if (!currentCategory) {
			throw new AppError('Category not found', 404);
		}

		const existingCategory = await categoryRepository.findCategoryByName(userId, currentCategory.type, name);
		if (existingCategory && existingCategory._id.toString() !== objectId.toString()) {
			throw new AppError('Category already exists', 409);
		}

		const category = await categoryRepository.editCategoryById(objectId,
										  							userId,
																  { name });
		return category;
	}
}

export default new categoryService();
