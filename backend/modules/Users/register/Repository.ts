import userModel from '../../../models/Users';
import categoryModel from '../../../models/Category';
import catalogModel from '../../../models/Catalog';
import { type Types } from 'mongoose';
import type { UserCategorySchema } from './types';

class authRepository {
    // Tìm kiếm người dùng trong cơ sở dữ liệu bằng email.
	async findUserByEmail(email: string) {
		return userModel.findOne({ email });
	}

    // Tìm kiếm người dùng trong cơ sở dữ liệu bằng tên đăng nhập.
	async findUserByUsername(username: string) {
		return userModel.findOne({ username });
	}

    // Tạo bản ghi người dùng mới trong cơ sở dữ liệu.
	async createUser(data: { username: string; email: string; phone: string; password: string }) {
		return userModel.create(data);
	}

    // Tạo các danh mục mặc định cho người dùng mới.
	async createDefaultCategories(data: UserCategorySchema[]) {
		return categoryModel.insertMany(data);
	}

    // Tìm ID của catalog dựa trên loại và tên.
	async findCatalogIdByTypeAndName(type: 'income' | 'expense', name: string) {
		const catalog = await catalogModel.findOne({ type, name })
			.select('_id')
			.lean<{ _id: Types.ObjectId } | null>();

		return catalog?._id ?? null;
	}

    // Tìm ID của catalog đầu tiên theo loại.
	async findFirstCatalogIdByType(type: 'income' | 'expense') {
		const catalog = await catalogModel.findOne({ type })
			.sort({ createdAt: 1 })
			.select('_id')
			.lean<{ _id: Types.ObjectId } | null>();

		return catalog?._id ?? null;
	}

    // Xóa tất cả danh mục của một người dùng.
	async deleteCategoriesByUserId(userId: Types.ObjectId) {
		return categoryModel.deleteMany({ userId });
	}

    // Xóa người dùng theo ID.
	async deleteUserById(userId: Types.ObjectId) {
		return userModel.findByIdAndDelete(userId);
	}
}

export default new authRepository();
