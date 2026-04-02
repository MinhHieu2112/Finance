import { randomUUID } from 'node:crypto';
import validator from 'validator'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from './Repository';
import AppError from '../../../utils/appError';
import defaultCategories from '../../../config/categories.json';

type defaultCategorySeed = {
	id: string;
	name: string;
	description?: string;
};

class authService {
	createToken(userData: { id: string; email: string; username: string }) {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new AppError('Missing JWT_SECRET in backend environment', 500);
		}
		return jwt.sign({ id	 : userData.id,
						  email   : userData.email,
						  username: userData.username, },
						  secret)
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

		const existingByUsername = await authRepository.findUserByUsername(username);
		if (existingByUsername) {
			throw new AppError('Username already exists', 409);
		}

		const hashedPassword = await bcrypt.hash(password, 10);
		const userID = randomUUID();
		const user = await authRepository.createUser({userID,
													  username,
													  email,
													  password: hashedPassword,});

		try {
			const categoriesForUser = (defaultCategories as defaultCategorySeed[]).map((category) => ({
				id: `${userID}-${category.id}`,
				userID,
				name: category.name,
				description: category.description ?? '',
			}));

			await authRepository.createDefaultCategories(categoriesForUser);
		} catch (_error) {
			await authRepository.deleteUserByUserID(userID);
			throw new AppError('Unable to initialize default categories for this account', 500);
		}

		const userData = {id	  : user.userID,
						  username: user.username,
						  email	  : user.email,};

		return {user : userData,
				token: this.createToken(userData),};
	}
}

export default new authService();
