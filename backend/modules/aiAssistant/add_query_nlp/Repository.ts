import categoryModel from '../../../models/Category';
import transactionModel from '../../../models/Transaction';
import type { transactionSchema } from './types';
import { type Types } from 'mongoose';
import type { AITransactionType } from '../aiAssistant';

class add_query_nlpRepository {
	// Thêm một giao dịch mới được trích xuất từ dữ liệu AI vào cơ sở dữ liệu.
	async addTransaction(data: transactionSchema): Promise<transactionSchema> {
		const transaction = await transactionModel.create(data);
		return transaction;
	}

	// Truy vấn danh sách các giao dịch dựa trên bộ lọc đã được chuẩn hóa.
	async queryTransaction(queryFilter: Record<string, unknown>,): Promise<transactionSchema[]> {
		return transactionModel.find(queryFilter)
							   .sort({ date: -1 })
							   .limit(2000)
							   .select('_id userId description type frequency date total_amount details createdAt updatedAt')
							   .lean<transactionSchema[]>();
	}
	// Tìm danh mục dựa trên tên và loại giao dịch để phục vụ ánh xạ dữ liệu AI.
	async findCategoryByName(userId: Types.ObjectId, type: AITransactionType, name: string) {
		const category = await categoryModel.findOne({ userId, type, name })
											.select('_id name')
											.lean<{ _id: Types.ObjectId; name: string }>();

		return category;
	}

	// Liệt kê tất cả tên danh mục của user để làm gợi ý (prompt) cho AI.
	async listCategoryNames(userId: Types.ObjectId): Promise<string[]> {
		const categories = await categoryModel.find({ userId }).select('name').lean<{ name: string }[]>();
		return categories.map(c => c.name);
	}
}
export default new add_query_nlpRepository();
