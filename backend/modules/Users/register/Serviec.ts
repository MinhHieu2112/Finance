import validator from 'validator'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from './Repository';
import AppError from '../../../utils/appError';

class authService {
	createToken(id: any) {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new AppError('Missing JWT_SECRET in backend environment', 500);
		}
		return jwt.sign({ id }, secret)
	}

	async register(data: { username: string; email: string; password: string }) {
		const username = data.username?.trim();
		const email    = data.email?.trim().toLowerCase();
		const password = data.password;

		if (!username || !email || !password) {
			throw new AppError('Missing required register fields', 400);
		}

		if (password.length < 4) {
			throw new AppError('Password must be at least 4 characters', 400);
		}

		if (!validator.isEmail(email)) {
			throw new AppError('Please provide a valid email', 400);
		}

		const existingByEmail = await authRepository.findUserByEmail(email);
		if (existingByEmail) {
			throw new AppError('Email already exists', 409);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const user = await authRepository.createUser({username,
													  email,
													  password: hashedPassword,});

		const userData = {id	  : user.id,
						  username: user.username,
						  email	  : user.email,};

		return {user : userData,
				token: this.createToken(userData),};
	}
}

export default new authService();
