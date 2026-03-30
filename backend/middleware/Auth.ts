import { type Request, type Response, type NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import AppError from '../utils/appError';

interface TokenPayload {
	sub?: string;
	email?: string;
	username?: string;
}

const protect = (req: Request, res: Response, next: NextFunction) => {
	const authHeader = req.headers.authorization;
	if (!authHeader || !authHeader.startsWith('Bearer ')) {
		return next(new AppError('Unauthorized', 401));
	}

	const token = authHeader.slice('Bearer '.length).trim();
	const secret = process.env.JWT_SECRET;

	if (!secret) {
		return next(new AppError('Missing JWT_SECRET in backend environment', 500));
	}

	try {
		const decoded = jwt.verify(token, secret) as TokenPayload;
		if (!decoded.sub || !decoded.email || !decoded.username) {
			return next(new AppError('Invalid token payload', 401));
		}

		res.locals.authUser = {
			id: decoded.sub,
			email: decoded.email,
			username: decoded.username,
		};

		return next();
	} catch (_error) {
		return next(new AppError('Invalid or expired token', 401));
	}
};

export default protect;
