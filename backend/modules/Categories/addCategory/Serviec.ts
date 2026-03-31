import { randomUUID } from 'node:crypto';
import categoryRepository from './Repository';
import AppError from '../../../utils/appError';

class categoryService {
	async addCategory(data: { name: string; description?: string }) {
		const name = data.name?.trim();
		const description = data.description?.trim() ?? '';

		if (!name) {
			throw new AppError('Category name is required', 400);
		}

		const existingCategory = await categoryRepository.findByName(name);
		if (existingCategory) {
			throw new AppError('Category already exists', 409);
		}

		return categoryRepository.addCategory({ id: randomUUID(),
												   name,
												   description, });
	}
}

export default new categoryService();
