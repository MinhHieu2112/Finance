import mongoose from 'mongoose';
import dotenv from 'dotenv';
import app from './app';

// Handle uncaught exceptions
process.on('uncaughtException', (err: Error) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

dotenv.config({ path: './.env' });

const resolveDbUri = (): string => {
  const isDocker = process.env.NODE_ENV === 'docker';
  const rawDb = isDocker ? process.env.DATABASE_DOCKER : process.env.DATABASE_LOCAL;

  if (!rawDb) {
    if (process.env.MONGO_URI) {
      return process.env.MONGO_URI;
    }
    throw new Error('Missing DATABASE_LOCAL / DATABASE_DOCKER / MONGO_URI in environment');
  }

  const password = process.env.DATABASE_PASSWORD;
  return password ? rawDb.replace('<PASSWORD>', password) : rawDb;
};

const DB = resolveDbUri();

mongoose.connect(DB).then(() => {
  console.log('DB connected');
});

const port = Number(process.env.PORT) || 4000;
const server = app.listen(port, () => {
  console.log(`Server started on http://localhost:${port}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
