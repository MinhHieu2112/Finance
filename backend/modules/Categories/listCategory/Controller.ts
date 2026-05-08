import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Service';

// Lấy danh sách tất cả các danh mục thuộc về người dùng hiện tại.
const listCategory = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser 	 = res.locals.authUser;
		const categories = await categoryService.listCategories(authUser.id);

		res.status(200).json({ success: true,
							   message: 'Categories loaded successfully',
							   categories });
	} catch (error) {
		next(error);
	}
};

export default listCategory;
