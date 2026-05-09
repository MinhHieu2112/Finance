import validator from 'validator'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from './Repository';
import AppError from '../../../utils/appError';
import type { AuthResult, AuthTokenPayload, LoginPayload } from './types';

class authService {
    // Tạo mã xác thực JWT cho người dùng khi đăng nhập thành công.
	createToken(userData: AuthTokenPayload) {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new AppError('Missing JWT_SECRET in backend environment', 500);
		}
		const expiresIn = '7d';
		return jwt.sign({id	  : userData.id,
						 email   : userData.email,
						 username: userData.username,}, 
						 secret,
						 { expiresIn });
	}

	// Xử lý quy trình đăng nhập, bao gồm xác thực email và mật khẩu.
	async login(data: LoginPayload): Promise<AuthResult> {
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
			throw new AppError('Invalid email', 401);
		}

		const isPasswordValid = await bcrypt.compare(password, user.password);
		if (!isPasswordValid) {
			throw new AppError('Invalid password', 401);
		}

		const userData = {id	  : user._id,
						  username: user.username,
						  email   : user.email,
						  phone   : user.phone};

		return {user : userData,
				token: this.createToken(userData)};
	}
}

export default new authService();
