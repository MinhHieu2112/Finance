import userModel from '../../../models/Users';

class authRepository {
	async findUserByEmail(email: string) {
		return userModel.findOne({ email });
	}

	async findUserByUsername(username: string) {
		return userModel.findOne({ username });
	}

	async createUser(data: { username: string; email: string; password: string }) {
		return userModel.create(data);
	}
}

export default new authRepository();
