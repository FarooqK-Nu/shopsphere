import { getCache, setCache } from '../config/redis.js';
import logger from '../utils/logger.js';

/**
 * Express middleware that caches GET responses in Redis.
 *
 * Cache key = `prefix:${req.url}` (includes query string, so pagination/filters
 * automatically produce distinct cache entries).
 *
 * @param {string} prefix   Namespace prefix, e.g. 'products' or 'categories'
 * @param {number} ttl      Time-to-live in seconds (default: 60 s)
 */
const cache = (prefix, ttl = 60) => async (req, res, next) => {
  // Only cache GET requests
  if (req.method !== 'GET') return next();

  const key = `${prefix}:${req.url}`;

  try {
    const cached = await getCache(key);
    if (cached) {
      logger.info(`Cache HIT [${key}]`);
      return res.status(200).json({
        status: 'success',
        fromCache: true,
        ...cached
      });
    }
    logger.info(`Cache MISS [${key}]`);
  } catch (err) {
    // Redis failure must not crash the request — just skip cache
    logger.error(`Cache middleware error: ${err.message}`);
    return next();
  }

  // Monkey-patch res.json to intercept the outgoing response and cache it
  const originalJson = res.json.bind(res);
  res.json = async (body) => {
    if (res.statusCode === 200 && body?.status === 'success') {
      // Store everything except the 'status' key (we re-add it on HIT)
      const { status, ...rest } = body;
      await setCache(key, rest, ttl);
    }
    return originalJson(body);
  };

  next();
};

export default cache;
