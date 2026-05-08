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

}

export default new add_trans_by_receiptImgRepository();
