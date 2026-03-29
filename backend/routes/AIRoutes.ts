import express from 'express';
import getGeminiAdvice from '../modules/Gemini/Controller';

const AIRouter = express.Router();

AIRouter
    .route('/advice')
    .get(getGeminiAdvice);

export default AIRouter;