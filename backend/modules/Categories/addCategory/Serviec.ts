import categoryRepository from './Repository';
import AppError from '../../../utils/appError';
import type { CategoryWithUserPayload } from './types';
// import { toObjectId } from '../../../utils/objectId';

class categoryService {
	async addCategory(data: CategoryWithUserPayload) {
		const userId = data.userId;
		const name = data.name?.trim();
		const description = data.description?.trim() ?? '';

		if (!userId) {
			throw new AppError('User id is required', 400);
		}

		if (!name) {
			throw new AppError('Category name is required', 400);
		}

		const existingCategory = await categoryRepository.findByName(userId, name);
		if (existingCategory) {
			throw new AppError('Category already exists', 409);
		}

		return categoryRepository.addCategory({ userId: userId,
												   name,
												   description, });
	}
}

export default new categoryService();
