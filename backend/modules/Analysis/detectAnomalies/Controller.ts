import { type Request, type Response, type NextFunction } from 'express';
import detectAnomaliesService from './Service';

const getDetectAnomalies = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser  = res.locals.authUser;
		const anomalies = await detectAnomaliesService.getDetectAnomalies(authUser.id);

		res.status(200).json({ success: true,
							   message: 'Anomalies loaded successfully',
							   anomalies });
	} catch (error) {
		next(error);
	}
};

export default getDetectAnomalies;
