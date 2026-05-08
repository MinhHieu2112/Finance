import { type Request, type Response, type NextFunction } from 'express';
import authService from './Service';

// Tiếp nhận yêu cầu đăng ký tài khoản mới từ client và khởi tạo dữ liệu mặc định cho người dùng.
const register = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { username, email, password, phone } = req.body;

		const authData = await authService.register({username,
													 email,
													 password,
													 phone,});

		res.status(201).json({success: true,
							  message: 'Register successful',
							  ...authData,});
	} catch (error) {
		next(error);
	}
};

export default register;
