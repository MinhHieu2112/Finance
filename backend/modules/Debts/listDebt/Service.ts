import listDebtRepository from './Repository';
import { Types } from 'mongoose';
import AppError from '../../../utils/appError';
import Transaction from '../../../models/Transaction';
import { TransactionType } from '../../Transactions/addTransaction/types';

class ListDebtService {
    /**
     * Đồng bộ hóa danh sách nợ từ module Transaction theo mô hình PULL.
     * Đảm bảo an toàn dữ liệu ngay cả khi có bản ghi lỗi.
     */
    async listDebts(userId: Types.ObjectId) {
        if (!userId) {
            throw new AppError('Yêu cầu UserId', 400);
        }

        try {
            // 1. Lấy tất cả giao dịch loại 'debt' thực tế
            const allDebtTransactions = await Transaction.find({
                userId,
                type: TransactionType.DEBT
            }).lean();

            // 2. Lấy danh sách nợ hiện có (Sử dụng lean để tối ưu hiệu năng và tránh lỗi object)
            const existingDebts = await listDebtRepository.findAllByUserId(userId);

            // Tạo Map tra cứu an toàn
            const transactionMap = new Map(allDebtTransactions.map(t => [t._id.toString(), t]));
            
            // Lọc bỏ các bản ghi nợ thiếu transactionId trước khi tạo Map
            const validExistingDebts = existingDebts.filter(d => !!d.transactionId);
            const existingDebtMap = new Map(validExistingDebts.map(d => [d.transactionId.toString(), d]));

            // --- A. TẠO MỚI: Đồng bộ các giao dịch nợ chưa có bản ghi Debt ---
            const newDebtsToCreate = allDebtTransactions
                .filter(t => !existingDebtMap.has(t._id.toString()))
                .map(t => ({
                    userId: t.userId,
                    transactionId: t._id,
                    amount: t.base_amount || t.total_amount,
                    description: t.description,
                    status: 'unpaid'
                }));

            if (newDebtsToCreate.length > 0) {
                await listDebtRepository.createDebt(newDebtsToCreate);
            }

            // --- B. CẬP NHẬT & XÓA: Dọn dẹp bản ghi trống hoặc cập nhật số liệu ---
            for (const debt of existingDebts) {
                const transactionIdStr = debt.transactionId?.toString();
                const relatedTransaction = transactionIdStr ? transactionMap.get(transactionIdStr) : null;

                if (!relatedTransaction) {
                    // Xóa bản ghi nếu không còn giao dịch gốc hoặc ID bị lỗi
                    await listDebtRepository.deleteById(debt._id);
                } else {
                    // Cập nhật nếu có sự thay đổi về số tiền hoặc mô tả
                    const currentAmount = relatedTransaction.base_amount || relatedTransaction.total_amount;
                    if (debt.amount !== currentAmount || debt.description !== relatedTransaction.description) {
                        await listDebtRepository.updateByTransactionId(relatedTransaction._id, {
                            amount: currentAmount,
                            description: relatedTransaction.description
                        });
                    }
                }
            }

            // 3. Trả về danh sách nợ đã được làm sạch và đồng bộ
            return await listDebtRepository.getDebtsByUserId(userId);
        } catch (error) {
            console.error('Lỗi nghiêm trọng trong ListDebtService:', error);
            throw new AppError('Không thể đồng bộ dữ liệu khoản nợ. Vui lòng kiểm tra lại giao dịch.', 500);
        }
    }
}

export default new ListDebtService();
