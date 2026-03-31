import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Serviec';

const listCategory = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const categories = await categoryService.listCategories();

		res.status(200).json({ success: true, categories });
	} catch (error) {
		next(error);
	}
};

export default listCategory;
