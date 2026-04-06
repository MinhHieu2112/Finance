import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Serviec';
import { Types } from 'mongoose';

const editCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name, description } = req.body;
		const authUser = res.locals.authUser;

		const categoryId = new Types.ObjectId(Array.isArray(req.params.id) ? req.params.id[0] : req.params.id);
		const category   = await categoryService.editCategory(categoryId,
															  authUser.id,
															  { name, description });

		res.status(200).json({ success: true, category });
	} catch (error) {
		next(error);
	}
};

export default editCategory;
