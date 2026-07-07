import { createClient } from 'redis';
import logger from '../utils/logger.js';

let redisClient;

export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('error', (err) => {
      logger.error(`Redis client error: ${err.message}`);
    });

    redisClient.on('connect', () => {
      logger.info('Redis client connected successfully');
    });

    redisClient.on('reconnecting', () => {
      logger.warn('Redis client reconnecting...');
    });

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.error(`Redis connection failed: ${error.message}`);
    // Do not crash the server — app can run without Redis
    // Caching will silently be bypassed
  }
};

export const getRedisClient = () => redisClient;

/**
 * Get a cached value by key.
 * Returns null if Redis is unavailable or key does not exist.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
export const getCache = async (key) => {
  if (!redisClient?.isOpen) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error(`Redis GET error [${key}]: ${err.message}`);
    return null;
  }
};

/**
 * Set a cached value with an optional TTL in seconds.
 * @param {string} key
 * @param {any} value
 * @param {number} ttlSeconds  Default: 60 seconds
 */
export const setCache = async (key, value, ttlSeconds = 60) => {
  if (!redisClient?.isOpen) return;
  try {
    await redisClient.setEx(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    logger.error(`Redis SET error [${key}]: ${err.message}`);
  }
};

/**
 * Delete one or more cached keys (supports glob patterns via SCAN + DEL).
 * @param {string} pattern  e.g. 'products:*'
 */
export const invalidateCache = async (pattern) => {
  if (!redisClient?.isOpen) return;
  try {
    // SCAN for matching keys and delete them
    let cursor = 0;
    do {
      const reply = await redisClient.scan(cursor, { MATCH: pattern, COUNT: 100 });
      cursor = reply.cursor;
      if (reply.keys.length > 0) {
        await redisClient.del(reply.keys);
      }
    } while (cursor !== 0);
  } catch (err) {
    logger.error(`Redis INVALIDATE error [${pattern}]: ${err.message}`);
  }
};
