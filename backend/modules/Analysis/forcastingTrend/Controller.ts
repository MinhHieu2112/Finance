import { type Request, type Response, type NextFunction } from 'express';
import forcastingTrendService from './Service';

// Xử lý yêu cầu dự báo xu hướng tài chính và phân tích luồng tiền hàng tháng.
const getForcastingTrend = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser = res.locals.authUser;
		const trend    = await forcastingTrendService.getForcastingTrend(authUser.id);

		res.status(200).json({ success: true,
							   message: 'Tải dữ liệu xu hướng thành công',
							   trend });
	} catch (error) {
		next(error);
	}
};

export default getForcastingTrend;
