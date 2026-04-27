import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Service';

const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser 	 = res.locals.authUser;
		const categoryId = req.params.id;

		await categoryService.deleteCategory(categoryId as string, authUser.id);
		res.status(200).json({ success: true,
							   message: 'Category deleted successfully' });
	} catch (error) {
		next(error);
	}
};

export default deleteCategory;
