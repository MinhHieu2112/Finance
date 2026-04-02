import AppError from '../../../utils/appError';
import categoryRepository from './Repository';

class categoryService {
	async deleteCategory(id: string, userID: string) {
		if (!id) {
			throw new AppError('Category id is required', 400);
		}

		if (!userID) {
			throw new AppError('User id is required', 400);
		}

		const deletedCategory = await categoryRepository.deleteCategoryById(id, userID);
		if (!deletedCategory) {
			throw new AppError('Category not found', 404);
		}

		return deletedCategory;
	}
}

export default new categoryService();
