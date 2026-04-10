import { type Request, type Response, type NextFunction } from 'express';
import authService from './Serviec';
import type { RegisterPayload } from './types';

const register = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { username, email, password } = req.body as RegisterPayload;

		const authData = await authService.register({username,
													 email,
													 password,});

		res.status(201).json({success: true,
							  ...authData,});
	} catch (error) {
		next(error);
	}
};

export default register;
