import express from 'express';
import multer from 'multer';
import auth from '../middleware/Auth';
import getForecastingTrend from '../modules/Analysis/forecastingTrend/Controller';
import getSavingSuggestion from '../modules/Analysis/savingSuggestion/Controller';
import summaryController from '../modules/Analysis/summary/Controller';

const analysisRouter = express.Router();
const upload = multer({ dest: 'uploads/' });

analysisRouter.use(auth);

analysisRouter
	.route('/summary')
	.get(summaryController.getSummary);

analysisRouter
	.route('/forecasting-trend')
	.get(getForecastingTrend);

analysisRouter
	.route('/saving-suggestion')
	.get(getSavingSuggestion);

export default analysisRouter;
