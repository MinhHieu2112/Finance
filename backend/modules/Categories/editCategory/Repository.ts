import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { CategoryType, CategoryUpdatePayload } from '../Categories';

class categoryRepository {
	// Tìm danh mục theo ID và người dùng để xác thực quyền sở hữu.
	async findCategoryByIdAndUser(categoryId: Types.ObjectId, userId: Types.ObjectId) {
		return categoryModel.findOne({ _id: categoryId, userId })
							.select('_id type')
							.lean<{ _id: Types.ObjectId; type: CategoryType } | null>();
	}

	// Tìm danh mục theo tên và loại để tránh trùng lặp khi cập nhật.
	async findCategoryByName(userId: Types.ObjectId, type: CategoryType, name: string) {
		return categoryModel.findOne({ userId, type, name });
	}

	// Thực hiện cập nhật dữ liệu danh mục trong cơ sở dữ liệu.
	async editCategoryById(categoryId: Types.ObjectId, userId: Types.ObjectId, data: CategoryUpdatePayload) {
		return categoryModel.findOneAndUpdate({ _id: categoryId, 
											   	userId },
											    data,
											  { new: true, 
												runValidators: true });
	}
}

export default new categoryRepository();
