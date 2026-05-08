import User from '../../../models/Users';
import { Types } from 'mongoose';

class changePasswordRepository {
    // Tìm người dùng theo ID và lấy kèm mật khẩu để so sánh.
  async findUserById(id: Types.ObjectId | string) {
    return User.findById(id).select('+password');
  }

  // Cập nhật mật khẩu mới vào cơ sở dữ liệu.
  async updatePassword(id: Types.ObjectId | string, hashedPassword: string) {
    return User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });
  }
}

export default new changePasswordRepository();
