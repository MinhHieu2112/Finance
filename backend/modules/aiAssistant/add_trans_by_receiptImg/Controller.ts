import { type Request, type Response, type NextFunction } from 'express';
import add_trans_by_receiptImgService from './Service';

// Tiếp nhận hình ảnh hóa đơn để trích xuất thông tin giao dịch thông qua AI.
const add_trans_by_receiptImg = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser = res.locals.authUser;
		const file = req.file?.buffer;
		
		if (!file) {
			res.status(400).json({ success: false, message: 'Vui lòng cung cấp file hình ảnh.' });
			return;
		}

		const result   = await add_trans_by_receiptImgService.handleReceiptImage(authUser.id, file);

		res.status(200).json({
			success: true,
			message: 'Trích xuất dữ liệu hóa đơn thành công',
			result: result,
		});
	} catch (error) {
		next(error);
	}
};

export { add_trans_by_receiptImg };
