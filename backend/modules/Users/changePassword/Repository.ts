import User from '../../../models/Users';
import { Types } from 'mongoose';

class changePasswordRepository {
  async findUserById(id: Types.ObjectId | string) {
    return User.findById(id).select('+password');
  }

  async updatePassword(id: Types.ObjectId | string, hashedPassword: string) {
    return User.findByIdAndUpdate(id, { password: hashedPassword }, { new: true });
  }
}

export default new changePasswordRepository();
