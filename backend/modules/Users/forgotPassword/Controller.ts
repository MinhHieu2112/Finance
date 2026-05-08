import { Request, Response, NextFunction } from 'express';
import forgotPasswordService from './Service';

class forgotPasswordController {
    // Controller xử lý yêu cầu gửi mã OTP phục hồi mật khẩu.
    async requestReset(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await forgotPasswordService.requestReset(req.body);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }

    // Controller xử lý việc xác thực OTP và cập nhật mật khẩu mới.
    async resetPassword(req: Request, res: Response, next: NextFunction) {
        try {
            const result = await forgotPasswordService.resetPassword(req.body);
            res.status(200).json({
                success: true,
                ...result
            });
        } catch (error) {
            next(error);
        }
    }
}

export default new forgotPasswordController();
