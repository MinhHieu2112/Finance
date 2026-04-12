import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Serviec';

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser 	 = res.locals.authUser;
		const categoryId = req.params.id;

		await categoryService.deleteCategory(categoryId as string, authUser.id);
		res.status(204).send();
	} catch (error) {
		next(error);
	}
};

export default deleteCategory;
