import { type Request, type Response, type NextFunction } from 'express';
import catalogService from './Service';

const listCatalog = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const catalogs = await catalogService.listCatalogs();

		res.status(200).json({ success: true,
							   message: 'Tải danh sách catalog thành công',
							   catalogs });
	} catch (error) {
		next(error);
	}
};

export default listCatalog;
