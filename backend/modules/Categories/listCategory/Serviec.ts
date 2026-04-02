import categoryRepository from './Repository';
import AppError from '../../../utils/appError';

class categoryService {
	async listCategories(userID: string) {
		if (!userID) {
			throw new AppError('User id is required', 400);
		}

		return categoryRepository.listCategories(userID);
	}
}

export default new categoryService();
