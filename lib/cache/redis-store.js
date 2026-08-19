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
let shutdownRegistered = false;

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

    clientPromise = client.connect().then(() => client);
    redisClientCache.set(redisUrl, clientPromise);
  }

  try {
    return await clientPromise;
  } catch (error) {
    redisClientCache.delete(redisUrl);
    throw error;
  }
}

/**
 * Gracefully closes all cached Redis clients.
 * This function is safe to call multiple times and never throws.
 */
export async function closeRedisClients() {
  for (const clientPromise of redisClientCache.values()) {
    try {
      const client = await clientPromise;

      if (client.isOpen) {
        await client.quit();
      }
    } catch (error) {
      // Ignore shutdown errors - never prevent process exit
      if (process.env.NODE_ENV !== "production") {
        console.warn("[cache] Redis client shutdown error:", error.message);
      }
    }
  }

  redisClientCache.clear();
}

/**
 * Registers graceful shutdown handlers for Redis client cleanup.
 * Handlers are only registered once to prevent duplicates during hot reload.
 */
function registerShutdownHandlers() {
  if (shutdownRegistered) {
    return;
  }

  const shutdownHandler = async () => {
    await closeRedisClients();
  };

  process.on("SIGINT", shutdownHandler);
  process.on("SIGTERM", shutdownHandler);
  process.on("beforeExit", shutdownHandler);

  shutdownRegistered = true;
}

// Register shutdown handlers on module load
registerShutdownHandlers();

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
