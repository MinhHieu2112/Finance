import express from 'express';
import morgan from "morgan";
import ExpressMongoSanitize from 'express-mongo-sanitize';
import transactionRoutes from './routes/transactionRoutes';
import AIRoutes from './routes/AIRoutes';
import AppError from './utils/appError';
import userRoutes from './routes/userRoutes';

const app = express();

app.use(express.json());
app.use(ExpressMongoSanitize());
app.use(morgan('dev'));

// CORS (allow all by default for current web frontend local dev)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }

  return next();
});

app.use('/api/transactions', transactionRoutes);
app.use('/api/ai', AIRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('API working');
});

export default app;
