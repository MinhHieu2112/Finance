import validator from 'validator'
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import authRepository from './Repository';
import AppError from '../../../utils/appError';
import defaultCategories from '../../../config/categories.json';
import { Types } from 'mongoose';
import type {
	AuthResult,
	AuthTokenPayload,
	RegisterPayload,
	UserCategorySchema,
	UserDefaultCategorySchema,
} from './types';

class authService {
	private async prepareDefaultCategories(userId: Types.ObjectId) {
		const deduped = new Map<string, UserCategorySchema>();
		const catalogIdCache = new Map<'income' | 'expense', Types.ObjectId>();

		for (const category of defaultCategories as UserDefaultCategorySchema[]) {
			const name = category.name?.trim();
			const type = category.type;
			if (!name) {
				continue;
			}

			if (type !== 'income' && type !== 'expense') {
				continue;
			}

			const key = `${type}:${name.toLowerCase()}`;
			if (!deduped.has(key)) {
				let catalogId = catalogIdCache.get(type);
				if (!catalogId) {
					const preferredName = type === 'income' ? 'Income' : 'Living Expenses';

					catalogId = await authRepository.findCatalogIdByTypeAndName(type, preferredName)
						?? await authRepository.findFirstCatalogIdByType(type)
						?? undefined;
					if (!catalogId) {
						throw new AppError(`Catalog for ${type} not found. Please import catalogs first.`, 500);
					}
					catalogIdCache.set(type, catalogId);
				}

				deduped.set(key, {
					userId,
					catalogId,
					name,
					description: category.description?.trim() ?? '',
					type,
				});
			}
		}

		const categories = Array.from(deduped.values());
		if (categories.length === 0) {
			throw new AppError('Default categories configuration is invalid', 500);
		}

		return categories;
	}

	createToken(userData: AuthTokenPayload) {
		const secret = process.env.JWT_SECRET;
		if (!secret) {
			throw new AppError('Missing JWT_SECRET in backend environment', 500);
		}
		return jwt.sign({ id	 : userData.id,
						  email   : userData.email,
						  username: userData.username, },
						  secret)
	}

	async register(data: RegisterPayload): Promise<AuthResult> {
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
			const categoriesForUser = await this.prepareDefaultCategories(user._id);

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
