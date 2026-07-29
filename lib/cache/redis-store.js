import "server-only";
import { success, miss, error, unwrap } from "../db/redis-result";

/**
 * Redis cache store implementation with structured result handling.
 * 
 * This store returns structured result objects that distinguish between:
 * - Cache misses (key not found)
 * - Redis failures (connection errors, timeouts, etc.)
 * - Successful operations
 * 
 * This improves observability and allows monitoring systems to detect
 * infrastructure issues while maintaining graceful degradation.
 * 
 * Backward compatibility: The `unwrap()` helper function can be used to
 * extract the underlying value, returning null for both misses and errors,
 * matching the previous behavior.
 */

const DEFAULT_REDIS_PREFIX = "pathfinder:cache";
const DEFAULT_TTL_MS = 1000 * 60 * 10;
const redisClientCache = new Map();

async function getRedisClient(redisUrl) {
  let clientPromise = redisClientCache.get(redisUrl);

  if (!clientPromise) {
    const { createClient } = await import("redis");
    const client = createClient({ url: redisUrl });

    client.on("error", (error) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[cache] Redis client error", error);
      }
    });

    clientPromise = client.connect().then(() => client).catch((err) => { console.error('[redis] Connection failed:', err); throw err; });
    redisClientCache.set(redisUrl, clientPromise);
  }

  try {
    return await clientPromise;
  } catch (error) {
    redisClientCache.delete(redisUrl);
    throw error;
  }
}

export function createRedisStore({
  redisUrl = process.env.REDIS_URL,
  keyPrefix = DEFAULT_REDIS_PREFIX,
  ttlMs = DEFAULT_TTL_MS,
} = {}) {
  if (!redisUrl) {
    throw new Error("REDIS_URL is required to enable Redis caching");
  }

  return {
    async get(key) {
      try {
        const client = await getRedisClient(redisUrl);
        const value = await client.get(`${keyPrefix}:${key}`);
        
        if (value === null) {
          return miss();
        }
        
        return success(value);
      } catch (err) {
        console.error("[cache] Redis get error:", err.message);
        return error(err, "get");
      }
    },

    async set(key, value, customTtlMs = ttlMs) {
      try {
        const client = await getRedisClient(redisUrl);
        await client.set(`${keyPrefix}:${key}`, value, { PX: customTtlMs });
        return success(true);
      } catch (err) {
        console.error("[cache] Redis set error:", err.message);
        return error(err, "set");
      }
    },

    async delete(key) {
      try {
        const client = await getRedisClient(redisUrl);
        await client.del(`${keyPrefix}:${key}`);
        return success(true);
      } catch (err) {
        console.error("[cache] Redis delete error:", err.message);
        return error(err, "delete");
      }
    },
  };
}

