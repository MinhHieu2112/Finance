import { Request, Response, NextFunction } from 'express';
import updateDebtService from './Service';

class UpdateDebtController {
    // Đánh dấu khoản nợ là đã thanh toán
    async markPaid(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            // Lấy userId từ auth middleware và chuyển sang string để so sánh
            const userId = res.locals.authUser.id.toString();
            
            const debt = await updateDebtService.markAsPaid(id, userId);
            
            res.status(200).json({
                status: 'success',
                debt
            });
        } catch (error) {
            next(error);
        }
    }

    // Đánh dấu khoản nợ là chưa thanh toán
    async markUnpaid(req: Request, res: Response, next: NextFunction) {
        try {
            const id = req.params.id as string;
            const userId = res.locals.authUser.id.toString();
            
            const debt = await updateDebtService.markAsUnpaid(id, userId);
            
            res.status(200).json({
                status: 'success',
                debt
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new UpdateDebtController();
