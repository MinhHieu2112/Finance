import { type Request, type Response, type NextFunction } from 'express';
import forcastingTrendService from './Service';

const getForcastingTrend = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser = res.locals.authUser;
		const trend    = await forcastingTrendService.getForcastingTrend(authUser.id);

		res.status(200).json({ success: true,
							   message: 'Trend loaded successfully',
							   trend });
	} catch (error) {
		next(error);
	}
};

export default getForcastingTrend;
