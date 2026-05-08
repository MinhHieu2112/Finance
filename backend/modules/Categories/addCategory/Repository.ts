import categoryModel from '../../../models/Category';
import catalogModel from '../../../models/Catalog';
import userModel from '../../../models/Users';
import { type Types } from 'mongoose';
import type { CategoryType, CategoryWithUserPayload } from './types';

class categoryRepository {
    // Tìm kiếm danh mục theo tên và loại để tránh trùng lặp cho cùng một người dùng.
	async findCategoryByName(userId: Types.ObjectId, type: CategoryType, name: string) {
		return categoryModel.findOne({ userId, type, name });
	}

    // Kiểm tra tính hợp lệ của catalog theo ID và loại (thu nhập/chi tiêu).
	async findCatalogByIdAndType(catalogId: Types.ObjectId, type: CategoryType) {
		const catalog = await catalogModel.findOne({ _id: catalogId, type })
										  .select('_id')
										  .lean<{ _id: Types.ObjectId } | null>();

		return catalog?._id;
	}

    // Tìm ID catalog dựa trên loại và tên cụ thể.
	async findCatalogIdByTypeAndName(type: CategoryType, name: string) {
		const catalog = await catalogModel.findOne({ type, name })
			.select('_id')
			.lean<{ _id: Types.ObjectId } | null>();

		return catalog?._id;
	}
    // Xác minh sự tồn tại của người dùng.
	async findUserById(id: Types.ObjectId) {
		return userModel.findOne({ _id: id })
						.select('_id')
						.lean<{ _id: Types.ObjectId } | null>();
	}

	// async findFirstCatalogIdByType(type: CategoryType) {
	// 	const catalog = await catalogModel.findOne({ type })
	// 		.sort({ createdAt: 1 })
	// 		.select('_id')
	// 		.lean<{ _id: Types.ObjectId } | null>();

	// 	return catalog?._id ?? null;
	// }

	// Lưu danh mục mới vào cơ sở dữ liệu.
	async addCategory(data: CategoryWithUserPayload) {
		return categoryModel.create(data);
	}
}

export default new categoryRepository();
