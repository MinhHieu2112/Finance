import express from 'express';
import multer from 'multer';
import auth from '../middleware/Auth';
import getForecastingTrend from '../modules/Analysis/forecastingTrend/Controller';
import getSavingSuggestion from '../modules/Analysis/savingSuggestion/Controller';
import getDetectAnomalies from '../modules/Analysis/detectAnomalies/Controller';


const analysisRouter = express.Router();
const upload = multer({ dest: 'uploads/' });

analysisRouter.use(auth);

analysisRouter
	.route('/forecasting-trend')
	.get(getForecastingTrend);

analysisRouter
	.route('/saving-suggestion')
	.get(getSavingSuggestion);

analysisRouter
	.route('/detect-anomalies')
	.get(getDetectAnomalies);

export default analysisRouter;
