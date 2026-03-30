import userModel from '../../../models/Users';

class authRepository {
	async findUserByEmail(email: string) {
		return userModel.findOne({ email }).select('+password');
	}
}

export default new authRepository();
