import express from 'express';
import multer from 'multer';
import auth from '../middleware/Auth';
import getForcastingTrend from '../modules/Analysis/forcastingTrend/Controller';
import getSavingSuggestion from '../modules/Analysis/savingSuggestion/Controller';
import getDetectAnomalies from '../modules/Analysis/detectAnomalies/Controller';


const analysisRouter = express.Router();
const upload = multer({ dest: 'uploads/' });

analysisRouter.use(auth);

analysisRouter
	.route('/forcasting-trend')
	.get(getForcastingTrend);

analysisRouter
	.route('/saving-suggestion')
	.get(getSavingSuggestion);

analysisRouter
	.route('/detect-anomalies')
	.get(getDetectAnomalies);

export default analysisRouter;
