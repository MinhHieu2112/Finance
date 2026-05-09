import { type Request, type Response, type NextFunction } from 'express';
import forecastingTrendService from './Service';

const getForecastingTrend = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser = res.locals.authUser;
		const trend    = await forecastingTrendService.getForecastingTrend(authUser.id);

		res.status(200).json({ success: true,
							   message: 'Trend loaded successfully',
							   trend });
	} catch (error) {
		next(error);
	}
};

export default getForecastingTrend;
