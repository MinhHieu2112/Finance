import AppError from '../../../utils/appError';
import categoryRepository from './Repository';

class categoryService {
	async editCategory(id: string, userID: string, data: { name: string; description?: string }) {
		const name = data.name?.trim();
		const description = data.description?.trim() ?? '';

		if (!id) {
			throw new AppError('Category id is required', 400);
		}

		if (!userID) {
			throw new AppError('User id is required', 400);
		}

		if (!name) {
			throw new AppError('Category name is required', 400);
		}

		const existingCategory = await categoryRepository.findByName(userID, name);
		if (existingCategory && existingCategory.id !== id) {
			throw new AppError('Category already exists', 409);
		}

		const category = await categoryRepository.editCategoryById(id,
															  userID,
																  { name,
																	description, });

		if (!category) {
			throw new AppError('Category not found', 404);
		}

		return category;
	}
}

export default new categoryService();
