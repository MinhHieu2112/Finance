import express from 'express';
import getGeminiAdvice from '../modules/Gemini/Controller';
import protect from '../middleware/Auth';

const AIRouter = express.Router();

AIRouter.use(protect);

AIRouter
    .route('/advice')
    .get(getGeminiAdvice);

export default AIRouter;