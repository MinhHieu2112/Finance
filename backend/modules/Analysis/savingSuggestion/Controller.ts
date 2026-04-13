import { type Request, type Response, type NextFunction } from 'express';
import forcastingTrendService from '../forcastingTrend/Serviec';
import detectAnomaliesService from '../detectAnomalies/Serviec';
import savingSuggestionService from './Serviec';

const getSavingSuggestion = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser    = res.locals.authUser;
		const trend       = await forcastingTrendService.getForcastingTrend(authUser.id);
		const anomalies   = await detectAnomaliesService.getDetectAnomalies(authUser.id);
		const savingsPlan = savingSuggestionService.buildSavingSuggestion(trend, anomalies);

		res.status(200).json({ success: true,
							   message: 'Saving suggestions loaded successfully',
							   savingsPlan });
	} catch (error) {
		next(error);
	}
};

export default getSavingSuggestion;
