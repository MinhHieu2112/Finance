import { Request, Response, NextFunction } from 'express';
import listDebtService from './Service';
import { Types } from 'mongoose';

class ListDebtController {
    // Xử lý yêu cầu lấy danh sách khoản nợ của người dùng hiện tại
    async handle(req: Request, res: Response, next: NextFunction) {
        try {
            // Lấy userId từ thông tin xác thực đã được middleware protect xử lý
            const userId = res.locals.authUser.id;
            
            // Gọi service để lấy danh sách nợ (kèm đồng bộ dữ liệu)
            const debts = await listDebtService.listDebts(new Types.ObjectId(userId));
            
            res.status(200).json({
                status: 'success',
                results: debts.length,
                debts
            });
        } catch (error) {
            // Chuyển lỗi sang middleware xử lý lỗi tập trung
            next(error);
        }
    }
}

export default new ListDebtController();
