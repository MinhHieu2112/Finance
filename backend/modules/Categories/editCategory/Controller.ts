import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Service';

// Tiếp nhận yêu cầu cập nhật thông tin danh mục từ client.
const editCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name, catalogId } = req.body;
		const authUser = res.locals.authUser;
		const categoryId = req.params.id as string;

		const category   = await categoryService.editCategory(categoryId,
															  authUser.id,
															  { name, catalogId });

		res.status(200).json({ success: true,
							   message: 'Cập nhật danh mục thành công',
							   category });
	} catch (error) {
		next(error);
	}
};

export default editCategory;
