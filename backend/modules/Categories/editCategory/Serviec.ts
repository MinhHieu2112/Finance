import AppError from '../../../utils/appError';
import categoryRepository from './Repository';
// import { toObjectId } from '../../../utils/objectId';
import { Types } from 'mongoose';

class categoryService {
	async editCategory(id: Types.ObjectId, userId: Types.ObjectId, data: { name: string; description?: string }) {
		const name = data.name?.trim();
		const description = data.description?.trim() ?? '';

		if (!id) {
			throw new AppError('Category id is required', 400);
		}

		if (!userId) {
			throw new AppError('User id is required', 400);
		}

		if (!name) {
			throw new AppError('Category name is required', 400);
		}

		const existingCategory = await categoryRepository.findByName(userId, name);
		if (existingCategory && existingCategory._id.toString() !== id.toString()) {
			throw new AppError('Category already exists', 409);
		}

		const category = await categoryRepository.editCategoryById(id,
											  userId,
																  { name,
																	description, });

		if (!category) {
			throw new AppError('Category not found', 404);
		}

		return category;
	}
}

export default new categoryService();
