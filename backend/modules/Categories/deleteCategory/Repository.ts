import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { CategoryWithUserPayload } from './types';

class categoryRepository {
	// Thực hiện xóa bản ghi danh mục trong cơ sở dữ liệu.
	async deleteCategoryById(categoryId: Types.ObjectId, userId: Types.ObjectId): Promise<CategoryWithUserPayload | null> {
		return categoryModel.findOneAndDelete({ _id: categoryId, userId })
							.lean<CategoryWithUserPayload | null>();
	}
}

export default new categoryRepository();
