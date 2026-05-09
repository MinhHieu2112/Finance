import listDebtRepository from '../listDebt/Repository';
import AppError from '../../../utils/appError';
import { DebtStatus } from '../../../models/Debt';

class UpdateDebtService {
    /**
     * Chuyển trạng thái khoản nợ sang Đã trả (Paid).
     * Chỉ người sở hữu bản ghi mới có quyền thực hiện.
     */
    async markAsPaid(debtId: string, userId: string) {
        if (!debtId) throw new AppError('Thiếu ID khoản nợ', 400);
        
        const debt = await listDebtRepository.findById(debtId);
        
        if (!debt) {
            throw new AppError('Không tìm thấy bản ghi nợ', 404);
        }

        // So sánh chuỗi ID một cách nghiêm ngặt để tránh lỗi kiểu dữ liệu
        if (debt.userId.toString() !== userId.toString()) {
            throw new AppError('Bạn không có quyền cập nhật khoản nợ này', 403);
        }

        const updatedDebt = await listDebtRepository.updateStatus(debtId, DebtStatus.PAID);
        if (!updatedDebt) {
            throw new AppError('Cập nhật trạng thái thất bại', 500);
        }

        return updatedDebt;
    }

    /**
     * Chuyển trạng thái khoản nợ sang Chưa trả (Unpaid).
     */
    async markAsUnpaid(debtId: string, userId: string) {
        if (!debtId) throw new AppError('Thiếu ID khoản nợ', 400);

        const debt = await listDebtRepository.findById(debtId);
        
        if (!debt) {
            throw new AppError('Không tìm thấy bản ghi nợ', 404);
        }

        if (debt.userId.toString() !== userId.toString()) {
            throw new AppError('Bạn không có quyền cập nhật khoản nợ này', 403);
        }

        const updatedDebt = await listDebtRepository.updateStatus(debtId, DebtStatus.UNPAID);
        if (!updatedDebt) {
            throw new AppError('Cập nhật trạng thái thất bại', 500);
        }

        return updatedDebt;
    }
}

export default new UpdateDebtService();
