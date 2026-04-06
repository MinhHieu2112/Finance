import validator from 'validator'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from './Repository';
import AppError from '../../../utils/appError';
import defaultCategories from '../../../config/categories.json';
import { Types } from 'mongoose';
import { CategorySchema, DefaultCategorySchema } from '../../types/Category';

class authService {
	private prepareDefaultCategories(userId: Types.ObjectId) {
		const deduped = new Map<string, CategorySchema>();

		(defaultCategories as DefaultCategorySchema[]).forEach((category) => {
			const name = category.name?.trim();
			if (!name) {
				return;
			}

			const key = name.toLowerCase();
			if (!deduped.has(key)) {
				deduped.set(key, {
					userId,
					name,
					description: category.description?.trim() ?? '',
				});
			}
		});

		const categories = Array.from(deduped.values());
		if (categories.length === 0) {
			throw new AppError('Default categories configuration is invalid', 500);
		}

		return categories;
	}

	createToken(userData: { id: Types.ObjectId; email: string; username: string }) {
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
		const user = await authRepository.createUser({username,
													 email,
													 password: hashedPassword,});

		try {
			const categoriesForUser = this.prepareDefaultCategories(user._id);

			await authRepository.createDefaultCategories(categoriesForUser);
		} catch (_error) {
			await authRepository.deleteCategoriesByUserId(user._id);
			await authRepository.deleteUserById(user._id);
			throw new AppError('Unable to initialize default categories for this account', 500);
		}

		const userData = {id	  : user._id,
						  username: user.username,
						  email	  : user.email,};

		return {user : userData,
				token: this.createToken(userData),};
	}
}

export default new authService();
