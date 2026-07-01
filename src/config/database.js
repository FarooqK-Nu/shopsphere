import mongoose from 'mongoose';
import { MongoClient } from 'mongodb'
import logger from '../utils/logger.js';

/**
 * Connect to MongoDB using database URL from environment variables.
 */
export const MongooseConnectDB = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL.replace(
      '<db_password>',
      process.env.DATABASE_PASSWORD,
    );
    // console.log(dbUrl);
    if (!dbUrl) {
      throw new Error(
        'DATABASE_URL is not defined in the environment variables',
      );
    }

    const connection = await mongoose.connect(dbUrl, { dbName: 'ecommers' });

    logger.info(
      `MongoDB connected successfully to host: ${connection.connection.host}`,
    );
  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1); // Exit process with failure code
  }
};

export const MongoConnectDB = async () => {
  try {
    const dbUrl = process.env.DATABASE_URL.replace(
      '<db_password>',
      process.env.DATABASE_PASSWORD,
    );

    let client = new MongoClient(
      dbUrl
    );

    await client.connect();

    return client = client.db("ecommers");

  } catch (error) {
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1); // Exit process with failure code
  }
};
