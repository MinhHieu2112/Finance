import { type Request, type Response, type NextFunction } from 'express';
import forecastingTrendService from '../forecastingTrend/Service';
import detectAnomaliesService from '../detectAnomalies/Service';
import savingSuggestionService from './Service';

// Kết hợp dữ liệu dự báo và phân tích bất thường để đưa ra các gợi ý tiết kiệm tối ưu.
const getSavingSuggestion = async (_req: Request, res: Response, next: NextFunction) => {
	try {
		const authUser    = res.locals.authUser;
		const trend       = await forecastingTrendService.getForecastingTrend(authUser.id);
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
