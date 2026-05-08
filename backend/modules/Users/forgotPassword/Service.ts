import bcrypt from 'bcryptjs';
import AppError from '../../../utils/appError';
import forgotPasswordRepository from './Repository';
import type { forgotPasswordRequest, resetPasswordRequest } from './types';

class forgotPasswordService {
    // Tạo mã OTP ngẫu nhiên 6 chữ số
    private generateOTP(): string {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Gửi yêu cầu quên mật khẩu bằng số điện thoại
    async requestReset(data: forgotPasswordRequest) {
        const phone = data.phone?.trim();

        if (!phone) {
            throw new AppError('Vui lòng cung cấp số điện thoại', 400);
        }

        const user = await forgotPasswordRepository.findByPhone(phone);
        if (!user) {
            throw new AppError('Không tìm thấy tài khoản với số điện thoại này', 404);
        }

        const otp = this.generateOTP();
        const expires = new Date(Date.now() + 10 * 60 * 1000); // Hết hạn sau 10 phút

        await forgotPasswordRepository.updateResetToken(user._id.toString(), otp, expires);

        return {
            message: 'Mã OTP đã được tạo',
            otp: otp 
        };
    }

    // Xác thực OTP và cập nhật mật khẩu mới
    async resetPassword(data: resetPasswordRequest) {
        const phone = data.phone?.trim();
        const { otp, newPassword } = data;

        if (!phone || !otp || !newPassword) {
            throw new AppError('Thiếu thông tin yêu cầu', 400);
        }

        if (newPassword.length < 4) {
            throw new AppError('Mật khẩu phải có ít nhất 4 ký tự', 400);
        }

        const user = await forgotPasswordRepository.findByPhone(phone);
        if (!user) {
            throw new AppError('Không tìm thấy người dùng', 404);
        }

        if (!user.resetPasswordToken || user.resetPasswordToken !== otp) {
            throw new AppError('Mã OTP không chính xác', 400);
        }

        if (!user.resetPasswordExpires || user.resetPasswordExpires < new Date()) {
            throw new AppError('Mã OTP đã hết hạn', 400);
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await forgotPasswordRepository.updatePassword(user._id.toString(), hashedPassword);

        return {
            message: 'Đặt lại mật khẩu thành công'
        };
    }
}

export default new forgotPasswordService();
