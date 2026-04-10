import { type Request, type Response, type NextFunction } from 'express';
import authService from './Serviec';
import type { LoginPayload } from './types';

const login = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { email, password } = req.body as LoginPayload;

		const authData = await authService.login({email,
												  password,});

		res.status(200).json({success: true,
							  ...authData,});
	} catch (error) {
		next(error);
	}
};

export default login;
