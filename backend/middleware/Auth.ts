import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import AppError from '../utils/appError';
import { type Types } from 'mongoose';

interface TokenPayload {
	id?: Types.ObjectId;
	email?: string;
	username?: string;
}

/**
 * Middleware xác thực người dùng bằng JSON Web Token (JWT).
 */
const protect = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return next(new AppError('Bạn chưa đăng nhập. Vui lòng đăng nhập để truy cập.', 401));
	}

	const token = authHeader.slice('Bearer '.length).trim();
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		return next(new AppError('Missing JWT_SECRET in backend environment', 500));
	}

	try {
		const decoded = jwt.verify(token, secret) as TokenPayload;
		if (!decoded.id || !decoded.email || !decoded.username) {
			return next(new AppError('Invalid token payload', 401));
		}

		if (!mongoose.Types.ObjectId.isValid(decoded.id)) {
			return next(new AppError('Invalid token user id', 401));
		}

		res.locals.authUser = {id		: decoded.id,
							   email	: decoded.email,
							   username : decoded.username,};

		return next();
	} catch (error) {
		const errorName = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
		if (errorName === 'TokenExpiredError') {
			return next(new AppError('Your token has expired. Please log in again.', 401));
		}

		if (errorName === 'JsonWebTokenError') {
			return next(new AppError('Invalid token. Please log in again.', 401));
		}

		return next(new AppError('Invalid or expired token', 401));
	}
};

export default protect;
