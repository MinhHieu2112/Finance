import express from 'express';
import multer from 'multer';
import auth from '../middleware/Auth';
import { createRateLimiter } from '../middleware/rateLimit';
import { add_query_nlp } from '../modules/aiAssistant/add_query_nlp/Controller';
import { add_trans_by_receiptImg } from '../modules/aiAssistant/add_trans_by_receiptImg/Controller';
import { mcp_tools } from '../modules/aiAssistant/MCP_tools/Controller';
import { getInsights } from '../modules/aiAssistant/insights/Controller';

const nlpRouter = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

nlpRouter.use(auth);

nlpRouter
	.route('/add&query')
	.post(add_query_nlp);

nlpRouter
	.route('/add-by-receipt-image')
	.post(add_trans_by_receiptImg);

nlpRouter
	.route('/mcp-tools')
	.post(upload.single('receipt'), createRateLimiter({windowMs: 60 * 60 * 1000, max: 30}), mcp_tools);

nlpRouter
	.route('/insights')
	.get(createRateLimiter({windowMs: 60 * 60 * 1000, max: 30}), getInsights);

export default nlpRouter;
