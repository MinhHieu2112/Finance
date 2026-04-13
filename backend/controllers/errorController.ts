import { type ErrorRequestHandler } from 'express';
import AppError from '../utils/appError';

type KnownError = Error & {
	statusCode?: number;
	status?: string;
	isOperational?: boolean;
	code?: number;
	keyValue?: Record<string, unknown>;
	path?: string;
	value?: unknown;
	errors?: Record<string, { message?: string }>;
};

const normalizeMessage = (message?: string): string => {
	if (!message) {
		return 'Something went wrong';
	}

	return message
		.replace(/^Error:\s*/i, '')
		.replace(/\s+/g, ' ')
		.trim();
};

const handleCastErrorDB = (err: KnownError) => {
	const message = `Invalid ${err.path}: ${String(err.value)}`;
	return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: KnownError) => {
	const duplicatedFieldValue = err.keyValue ? String(Object.values(err.keyValue)[0]) : 'value';
	const message = `${duplicatedFieldValue} already exists`;
	return new AppError(message, 409);
};

const handleValidationErrorDB = (err: KnownError) => {
	const errors = Object.values(err.errors || {}).map((item) => item.message).filter(Boolean);
	const message = errors.length ? `Invalid input data. ${errors.join('. ')}` : 'Invalid input data';
	return new AppError(message, 400);
};

const handleJWTError = () => new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = () => new AppError('Your token has expired. Please log in again.', 401);

const sendErrorDev = (err: KnownError, res: Parameters<ErrorRequestHandler>[2]) => {
	const statusCode = err.statusCode || 500;
	const status = err.status || 'error';

	res.status(statusCode).json({
		status,
		message: normalizeMessage(err.message),
		stack: err.stack,
	});
};

const sendErrorProd = (err: KnownError, res: Parameters<ErrorRequestHandler>[2]) => {
	if (err.isOperational) {
		return res.status(err.statusCode || 500).json({
			status: err.status || 'error',
			message: normalizeMessage(err.message),
		});
	}

	console.error('UNEXPECTED ERROR', err);

	return res.status(500).json({
		status: 'error',
		message: 'Something went wrong',
	});
};

const globalErrorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
	let parsedError: KnownError = {
		...err,
		message: err.message,
		name: err.name,
		stack: err.stack,
		statusCode: (err as KnownError).statusCode || 500,
		status: (err as KnownError).status || 'error',
		isOperational: (err as KnownError).isOperational || false,
	};

	if (parsedError.name === 'CastError') {
		parsedError = handleCastErrorDB(parsedError);
	}

	if (parsedError.code === 11000) {
		parsedError = handleDuplicateFieldsDB(parsedError);
	}

	if (parsedError.name === 'ValidationError') {
		parsedError = handleValidationErrorDB(parsedError);
	}

	if (parsedError.name === 'JsonWebTokenError') {
		parsedError = handleJWTError();
	}

	if (parsedError.name === 'TokenExpiredError') {
		parsedError = handleJWTExpiredError();
	}

	if (process.env.NODE_ENV === 'development') {
		sendErrorDev(parsedError, res);
		return;
	}

	sendErrorProd(parsedError, res);
};

export default globalErrorHandler;
