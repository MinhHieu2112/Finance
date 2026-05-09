import categoryRepository from './Repository';
import AppError from '../../../utils/appError';
import type { CategoryPayload, CategoryType, CategoryWithUserPayload } from './types';

const isValidCategoryType = (value: unknown): value is CategoryType => 
	['income', 'expense', 'debt', 'savings'].includes(value as string);

class categoryService {
    // Xử lý logic nghiệp vụ khi thêm danh mục, bao gồm kiểm tra trùng lặp và tính hợp lệ của catalog.
	async addCategory(data: CategoryPayload & { userId: CategoryWithUserPayload['userId'] }) {
		const userId 	= data.userId;
		const name 		= data.name.trim();
		const type 		= data.type;
		const catalogId = data.catalogId

		
		if (!userId || !name || !type || !catalogId) {
			throw new AppError('Không tìm thấy dữ liệu', 400);
		}

		const existingUser = await categoryRepository.findUserById(userId);
		if (!existingUser) {
			throw new AppError('Không tìm thấy tài khoản', 404);
		}

		if (!isValidCategoryType(type)) {
			throw new AppError('Loại danh mục không hợp lệ', 400);
		}

		const existingCategory = await categoryRepository.findCategoryByName(userId, type, name);
		if (existingCategory) {
			throw new AppError('Trùng danh mục', 409);
		}

		const existingCatalog = await categoryRepository.findCatalogByIdAndType(data.catalogId, type)
		if (!existingCatalog) {
			throw new AppError('Không tìm thấy nhóm danh mục', 400);
		}

		return categoryRepository.addCategory({ userId: userId,
												name,
												type,
												catalogId, });
	}
}

export default new categoryService();
