import { type Request, type Response, type NextFunction } from 'express';
import authService from './Service';

const login = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { email, password } = req.body;

		const authData = await authService.login({email,
												  password,});

		res.status(200).json({success: true,
							  message: 'Login successful',
							  ...authData,});
	} catch (error) {
		next(error);
	}
};

export default login;
