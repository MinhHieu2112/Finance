import userModel from '../../../models/Users';

class authRepository {
    // Tìm kiếm người dùng bằng email và lấy kèm mật khẩu để xác thực.
	async findUserByEmail(email: string) {
		return userModel.findOne({ email }).select('+password');
	}
}

export default new authRepository();
