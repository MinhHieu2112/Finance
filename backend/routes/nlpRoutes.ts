import express from 'express';
import auth from '../middleware/Auth';
import { add_query_nlp } from '../modules/aiAssistant/add_query_nlp/Controller';

const nlpRouter = express.Router();

nlpRouter.use(auth);

nlpRouter
	.route('/add&query')
	.post(add_query_nlp);

export default nlpRouter;
