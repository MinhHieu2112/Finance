import Debt from '../../../models/Debt';
import { Types } from 'mongoose';

class ListDebtRepository {
    // Truy vấn danh sách nợ kèm thông tin giao dịch (đã populate)
    async getDebtsByUserId(userId: Types.ObjectId) {
        return await Debt.find({ userId })
            .populate('transactionId')
            .sort({ createdAt: -1 });
    }

    // Cập nhật trạng thái thanh toán
    async updateStatus(debtId: string, status: string) {
        return await Debt.findByIdAndUpdate(
            debtId,
            { status },
            { new: true, runValidators: true }
        );
    }

    // Tìm kiếm theo ID bản ghi nợ
    async findById(debtId: string) {
        return await Debt.findById(debtId);
    }

    // Tìm kiếm theo ID giao dịch
    async findByTransactionId(transactionId: Types.ObjectId) {
        return await Debt.findOne({ transactionId });
    }

    // Tạo mới bản ghi nợ
    async createDebt(data: any) {
        return await Debt.create(data);
    }

    // Xóa bản ghi nợ theo ID giao dịch
    async deleteByTransactionId(transactionId: Types.ObjectId) {
        return await Debt.deleteMany({ transactionId });
    }

    // Xóa bản ghi nợ theo ID bản ghi
    async deleteById(id: any) {
        return await Debt.deleteOne({ _id: id });
    }

    // Cập nhật thông tin nợ dựa trên ID giao dịch
    async updateByTransactionId(transactionId: Types.ObjectId, data: any) {
        return await Debt.findOneAndUpdate({ transactionId }, data, { new: true });
    }

    // Lấy toàn bộ bản ghi nợ của user (không populate để kiểm tra ID)
    async findAllByUserId(userId: Types.ObjectId) {
        return await Debt.find({ userId }).lean(); // Sử dụng lean() để có plain JS object
    }
}

export default new ListDebtRepository();
