import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Service';

const editCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name } = req.body;
		const authUser = res.locals.authUser;
		const categoryId = req.params.id as string;

		const category   = await categoryService.editCategory(categoryId,
															  authUser.id,
															  { name });

		res.status(200).json({ success: true,
							   message: 'Category updated successfully',
							   category });
	} catch (error) {
		next(error);
	}
};

export default editCategory;
