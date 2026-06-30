import logger from './utils/logger.js';

// 1) HANDLE UNCAUGHT EXCEPTIONS (Must be at the very top)
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
  process.exit(1);
});

// Load environment variables
import 'dotenv/config';

import { MongooseConnectDB as connectDB } from './config/database.js';
import app from './app.js';

// 2) CONNECT TO DATABASE
connectDB();

// 3) START SERVER
const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  logger.info(`ShopSphere Server is running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});

// 4) HANDLE UNHANDLED REJECTIONS
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
  server.close(() => {
    process.exit(1);
  });
});
