import { type Request, type Response, type NextFunction } from 'express';
import categoryService from './Serviec';

const addCategory = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const { name, description } = req.body;
		const authUser = res.locals.authUser;

		const category = await categoryService.addCategory({ userId: authUser.id,
														name,
														description, });

		res.status(201).json({ success: true, category });
	} catch (error) {
		next(error);
	}
};

export default addCategory;
