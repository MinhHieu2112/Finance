import AppError from '../../../utils/appError';
import { Currency } from '../../types/Transactions';
import add_trans_by_receiptImgRepository from './Repository';
import { Types } from 'mongoose';
import { FinancetSchema } from "../../../utils/normalized";
import { convertToBase } from '../../../utils/currencyConverter';
import AIProviderService from '../MCP_tools/Service';
import type { AIDetailInput, AITransactionInput } from './types';

class add_trans_by_receiptImgService {
	// Xử lý và trích xuất dữ liệu giao dịch từ hình ảnh hóa đơn bằng công nghệ OCR qua AI
	async handleReceiptImage(userId: Types.ObjectId, file: Buffer): Promise<unknown[]> {
		if (!userId) throw new AppError('Lỗi hệ thống: Thiếu User ID', 400);
		if (!file) throw new AppError('Vui lòng cung cấp hình ảnh hóa đơn', 400);

		const categoryList = await add_trans_by_receiptImgRepository.listCategoryNames(userId);
		
		// 1. Gọi Dịch vụ AI Lõi (Provider)
		const aiResponse = await AIProviderService.processReceipt(file, categoryList);
		
		const { data } = aiResponse;

		// 2. Phân tích kết quả và map với Database
		const normalized = FinancetSchema.safeParse(data);
		if (!normalized.success) {
			const errorMessage = normalized.error.issues.map(issue => `${issue.path.join('.')}: ${issue.message}`).join(', ');
			throw new AppError(`Định dạng dữ liệu không hợp lệ: ${errorMessage}`, 400);
		}

		const transactions = normalized.data.transactions as AITransactionInput[];
		
		const results = await Promise.all(
			transactions.map(async (t) => {
				const details = await Promise.all(
					(t.details || []).map(async (d: AIDetailInput) => {
						const category = await add_trans_by_receiptImgRepository.findCategoryByName(userId, t.type, d.categoryName);
						if (!category) throw new AppError(`Category not found: ${d.categoryName}`, 404);

						return {
							categoryId: category._id,
							categoryName: category.name,
							quantity: d.quantity,
							amount: d.amount,
							base_amount: await convertToBase(d.amount, t.currency || Currency.VND, userId.toString()),
							name: d.name
						};
					})
				);

				const totalAmount = details.reduce((sum, d) => sum + (d.amount * d.quantity), 0);

				return {
					description: t.description,
					type: t.type,
					frequency: t.frequency,
					currency: t.currency || Currency.VND,
					date: t.date,
					total_amount: totalAmount,
					base_amount: await convertToBase(totalAmount, t.currency || Currency.VND, userId.toString()),
					details: details
				};
			})
		);
		return results;
	}
}

export default new add_trans_by_receiptImgService();
