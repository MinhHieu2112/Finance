import bcrypt from 'bcryptjs';
import changePasswordRepository from './Repository';
import AppError from '../../../utils/appError';
import type { ChangePasswordPayload } from './types';
import { Types } from 'mongoose';

class changePasswordService {
  // Xử lý logic kiểm tra mật khẩu cũ và cập nhật mật khẩu mới đã mã hóa.
  async changePassword(userId: Types.ObjectId | string, data: ChangePasswordPayload) {
    const { oldPassword, newPassword } = data;

    if (!oldPassword || !newPassword) {
      throw new AppError('Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới', 400);
    }

    if (newPassword.length < 4) {
      throw new AppError('Mật khẩu mới phải có ít nhất 4 ký tự', 400);
    }

    const user = await changePasswordRepository.findUserById(userId);
    if (!user) {
      throw new AppError('Không tìm thấy tài khoản người dùng', 404);
    }

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      throw new AppError('Mật khẩu hiện tại không đúng', 401);
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await changePasswordRepository.updatePassword(userId, hashedNewPassword);
  }
}

export default new changePasswordService();
