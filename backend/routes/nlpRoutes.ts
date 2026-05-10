import express from 'express';
import multer from 'multer';
import auth from '../middleware/Auth';
import { createRateLimiter } from '../middleware/rateLimit';
import { add_query_nlp } from '../modules/aiAssistant/add_query_nlp/Controller';
import { add_trans_by_receiptImg } from '../modules/aiAssistant/add_trans_by_receiptImg/Controller';
import { getInsights } from '../modules/Analysis/aiInsights/Controller';

const nlpRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

nlpRouter.use(auth);

nlpRouter
	.route('/add&query')
	.post(createRateLimiter({windowMs: 60 * 60 * 1000, max: 30}), add_query_nlp);

nlpRouter
	.route('/add-by-receipt-image')
	.post(upload.single('receipt'), createRateLimiter({windowMs: 60 * 60 * 1000, max: 30}), add_trans_by_receiptImg);

nlpRouter
	.route('/insights')
	.get(createRateLimiter({windowMs: 60 * 60 * 1000, max: 30}), getInsights);

export default nlpRouter;
