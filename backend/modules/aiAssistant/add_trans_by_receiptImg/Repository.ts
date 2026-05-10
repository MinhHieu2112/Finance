import categoryModel from '../../../models/Category';
import { type Types } from 'mongoose';
import type { AITransactionType } from '../aiAssistant';

class add_trans_by_receiptImgRepository {
	// Tìm kiếm danh mục theo tên và loại để phục vụ việc trích xuất dữ liệu từ hóa đơn.
	async findCategoryByName(userId: Types.ObjectId, type: AITransactionType, name: string) {
		const category = await categoryModel.findOne({ userId, type, name })
			.select('_id name')
			.lean<{ _id: Types.ObjectId; name: string }>();

		return category ?? null;
	}

	// Liệt kê tất cả tên danh mục của user để làm gợi ý (prompt) cho AI.
	async listCategoryNames(userId: Types.ObjectId): Promise<string[]> {
		const categories = await categoryModel.find({ userId }).select('name').lean<{ name: string }[]>();
		return categories.map(c => c.name);
	}

}

export default new add_trans_by_receiptImgRepository();
