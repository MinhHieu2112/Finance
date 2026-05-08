import { Types } from 'mongoose';
import transactionModel from '../../../models/Transaction';
import categoryModel from '../../../models/Category';

interface CategoryTotal {
	_id: {
		categoryId: Types.ObjectId;
		categoryName: string;
	};
	totalAmount: number;
}

class savingSuggestionRepository {
	// Truy vấn danh sách các danh mục chi tiêu phổ biến nhất của người dùng.
	async getPopularCategories(limit: number, userId: Types.ObjectId) {
		return categoryModel.aggregate([
			{ $match: { userId, type: 'expense' } },
			{ $group: { _id: { categoryId: '$_id', categoryName: '$name' }, count: { $sum: 1 } } },
			{ $sort: { count: -1 } },
			{ $limit: limit },
			{ $project: { _id: 0, category: '$_id', count: 1 } },
		]);
	}

	// Truy vấn tổng chi tiêu cho từng danh mục trong một khoảng thời gian.
	async getCategoryTotals(startDate: Date, endDate: Date, userId: Types.ObjectId) {
		return transactionModel.aggregate([
			{ $match: { userId, type: 'expense', date: { $gte: startDate, $lte: endDate } } },
			{
				$project: {
					_id: 0,
					details: 1,
				},
			},
			{ $unwind: '$details' },
			{
				$group: {
					_id: {
						categoryId: '$details.categoryId',
						categoryName: '$details.categoryName',
					},
					totalAmount: { 
						$sum: { 
							$multiply: [
								{ $cond: [{ $gt: ['$details.base_amount', 0] }, '$details.base_amount', '$details.amount'] }, 
								'$details.quantity'
							] 
						} 
					},
				},
			},
			{ $sort: { totalAmount: -1 } },
		]) as Promise<CategoryTotal[]>;
	}
}

export default new savingSuggestionRepository();
