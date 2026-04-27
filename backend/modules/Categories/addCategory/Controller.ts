import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Service';

const addCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name, type, catalogId } = req.body;
		const authUser = res.locals.authUser;

		const category = await categoryService.addCategory({userId: authUser.id,
															name,
															type,
															catalogId});

		res.status(201).json({ success: true,
							   message: 'Category added successfully',
							   category });
	} catch (error) {
		next(error);
	}
};

export default addCategory;
