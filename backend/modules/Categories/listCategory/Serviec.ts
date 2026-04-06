import categoryRepository from './Repository';
import AppError from '../../../utils/appError';
// import { toObjectId } from '../../../utils/objectId';
import { Types } from 'mongoose';

class categoryService {
	async listCategories(userId: Types.ObjectId) {
		if (!userId) {
			throw new AppError('User id is required', 400);
		}

		return categoryRepository.listCategories(userId);
	}
}

export default new categoryService();
