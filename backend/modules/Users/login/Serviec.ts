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

	async login(data: { email: string; password: string }) {
		const email    = data.email?.trim().toLowerCase();
		const password = data.password;

		if (!email || !password) {
			throw new AppError('Email and password are required', 400);
		}

		if (!validator.isEmail(email)) {
			throw new AppError('Please provide a valid email', 400);
		}

		const user = await authRepository.findUserByEmail(email);
		if (!user) {
			throw new AppError('Invalid email or password', 401);
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new AppError('Invalid email or password', 401);
		}

		const userData = {
			id: user.id,
			username: user.username,
			email: user.email,
		};

		return {
			user: userData,
			token: this.createToken(userData),
		};
	}
}

export default new authService();
