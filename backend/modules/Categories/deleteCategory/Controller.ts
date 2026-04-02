import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Serviec';

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const categoryId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
		const authUser = res.locals.authUser;

		await categoryService.deleteCategory(categoryId, authUser.id);
		res.status(204).send();
	} catch (error) {
		next(error);
	}
};

export default deleteCategory;
