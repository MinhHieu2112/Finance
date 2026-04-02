import { randomUUID } from 'node:crypto';
import categoryRepository from './Repository';
import AppError from '../../../utils/appError';

class categoryService {
	async addCategory(data: { userID: string; name: string; description?: string }) {
		const userID = data.userID?.trim();
		const name = data.name?.trim();
		const description = data.description?.trim() ?? '';

		if (!userID) {
			throw new AppError('User id is required', 400);
		}

		if (!name) {
			throw new AppError('Category name is required', 400);
		}

		const existingCategory = await categoryRepository.findByName(userID, name);
		if (existingCategory) {
			throw new AppError('Category already exists', 409);
		}

		return categoryRepository.addCategory({ id: randomUUID(),
												   userID,
												   name,
												   description, });
	}
}

export default new categoryService();
