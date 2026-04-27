import categoryRepository from './Repository';
import AppError from '../../../utils/appError';
import type { CategoryPayload, CategoryType, CategoryWithUserPayload } from './types';

const isValidCategoryType = (value: unknown): value is CategoryType => value === 'income' || value === 'expense';

class categoryService {
	async addCategory(data: CategoryPayload & { userId: CategoryWithUserPayload['userId'] }) {
		const userId 	= data.userId;
		const name 		= data.name.trim();
		const type 		= data.type;
		const catalogId = data.catalogId

		
		if (!userId || !name || !type || !catalogId) {
			throw new AppError('User id, name, type, and catalog id are required', 400);
		}

		const existingUser = await categoryRepository.findUserById(userId);
		if (!existingUser) {
			throw new AppError('User not found', 404);
		}

		if (!isValidCategoryType(type)) {
			throw new AppError('Category type must be income or expense', 400);
		}

		const existingCategory = await categoryRepository.findCategoryByName(userId, type, name);
		if (existingCategory) {
			throw new AppError('Category already exists', 409);
		}

		const existingCatalog = await categoryRepository.findCatalogByIdAndType(data.catalogId, type)
		if (!existingCatalog) {
			throw new AppError(`Catalog for ${type} not found or invalid.`, 400);
		}

		return categoryRepository.addCategory({ userId: userId,
												name,
												type,
												catalogId, });
	}
}

export default new categoryService();
