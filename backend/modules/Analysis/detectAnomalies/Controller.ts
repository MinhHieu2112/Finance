import { type Request, type Response, type NextFunction } from 'express';
import detectAnomaliesService from './Service';

// Xử lý yêu cầu phân tích và trả về danh sách các giao dịch có dấu hiệu bất thường.
const getDetectAnomalies = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser  = res.locals.authUser;
		const anomalies = await detectAnomaliesService.getDetectAnomalies(authUser.id);

		res.status(200).json({ success: true,
							   message: 'Tải dữ liệu phân tích bất thường thành công',
							   anomalies });
	} catch (error) {
		next(error);
	}
};

export default getDetectAnomalies;
