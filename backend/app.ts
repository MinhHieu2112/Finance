import express from 'express';
import morgan from "morgan";
import ExpressMongoSanitize from 'express-mongo-sanitize';
import transactionRoutes from './routes/transactionRoutes';
import analysisRoutes from './routes/analysisRoutes';
import userRoutes from './routes/userRoutes';
import categoryRoutes from './routes/categoryRoutes';
import nlpRoutes from './routes/nlpRoutes';
import AppError from './utils/appError';
import globalErrorHandler from './controllers/errorController';

const app = express();

app.use(express.json());
app.use(ExpressMongoSanitize());
app.use(morgan('dev'));

const defaultAllowedOrigins = [
  'http://localhost:3000',
];

const allowedOrigins = new Set(
  (process.env.CORS_ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
    .concat(process.env.CORS_ALLOWED_ORIGINS ? [] : defaultAllowedOrigins)
);

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (!origin) {
    return next();
  }

  if (!allowedOrigins.has(origin)) {
    if (req.method === 'OPTIONS') {
      return res.sendStatus(403);
    }
    return next(new AppError('CORS not allowed', 403));
  }

  res.header('Access-Control-Allow-Origin', origin);
  res.header('Vary', 'Origin');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/nlp', nlpRoutes);
app.get('/', (req, res) => {
  res.send('API working');
});

app.all('*', (req, _res, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

export default app;
