const mongoose = require('mongoose');
const logger = require('../utils/logger');

/**
 * Connect to MongoDB using database URL from environment variables.
 */
const connectDB = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL is not defined in the environment variables');
    }

    const connection = await mongoose.connect(dbUrl);

    logger.info(`MongoDB connected successfully to host: ${connection.connection.host}`);
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1); // Exit process with failure code
  }
};

module.exports = connectDB;
