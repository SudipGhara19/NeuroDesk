/**
 * Cache Service — Redis-backed with graceful fallback
 *
 * If REDIS_URL is not set in environment, all cache operations
 * silently no-op so the app runs normally without Redis.
 */

const Redis = require('ioredis');

let redis = null;

// Only connect if REDIS_URL is configured
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL, {
      // Fail fast — don't block app startup waiting for Redis
      connectTimeout: 3000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: true,
    });

    redis.on('connect', () => console.log('[Cache] Redis connected'));
    redis.on('error', (err) => {
      console.warn('[Cache] Redis error (falling back to no-cache):', err.message);
      redis = null; // Disable cache on persistent error
    });

    // Test connection eagerly
    redis.connect().catch((err) => {
      console.warn('[Cache] Redis connect failed:', err.message);
      redis = null;
    });
  } catch (err) {
    console.warn('[Cache] Redis init failed:', err.message);
    redis = null;
  }
}

const DEFAULT_TTL = 60 * 5; // 5 minutes

/**
 * Get a cached value by key.
 * Returns null if cache is unavailable or key not found.
 */
async function getCache(key) {
  if (!redis) return null;
  try {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    console.warn('[Cache] getCache error:', err.message);
    return null;
  }
}

/**
 * Set a cache value by key with an optional TTL in seconds.
 * Silently no-ops if cache is unavailable.
 */
async function setCache(key, value, ttlSeconds = DEFAULT_TTL) {
  if (!redis) return;
  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn('[Cache] setCache error:', err.message);
  }
}

/**
 * Delete a key from cache
 */
async function invalidateCache(key) {
  if (!redis) return;
  try {
    await redis.del(key);
  } catch (err) {
    console.warn('[Cache] invalidateCache error:', err.message);
  }
}

/**
 * Build a consistent cache key from a RAG query string
 * MD5 hashing to prevent excessively long keys
 */
function buildRagCacheKey(query) {
  // Simple, fast key: prefix + normalized query (lowercase + trimmed)
  const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
  return `rag:${Buffer.from(normalized).toString('base64').slice(0, 64)}`;
}

module.exports = { getCache, setCache, invalidateCache, buildRagCacheKey };
