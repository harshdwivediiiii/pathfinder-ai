import "server-only";
import { getRedisClient } from "../rate-limit/store.js";
import { DEFAULT_CACHE_TTL_MS } from "./utils.js";
import { success, miss, error, unwrap, isSuccess, isMiss, isError } from "../db/redis-result";

/**
 * Cache store implementations with structured result handling.
 * 
 * Both memory and Redis stores return structured result objects that distinguish
 * between cache misses, Redis failures, and successful operations.
 * 
 * This improves observability while maintaining graceful degradation.
 * Use `unwrap()` to extract values for backward-compatible behavior.
 */

const DEFAULT_STORE_DRIVER = "auto";
const DEFAULT_REDIS_PREFIX = "pathfinder:cache";

const redisClientCache = new Map();

function getRedisKey(prefix, cacheKey) {
  return `${prefix}:${cacheKey}`;
}

async function getSharedRedisClient(redisUrl) {
  let clientPromise = redisClientCache.get(redisUrl);

  if (!clientPromise) {
    clientPromise = getRedisClient(redisUrl).catch((error) => {
      redisClientCache.delete(redisUrl);
      throw error;
    });

    redisClientCache.set(redisUrl, clientPromise);
  }

  return await clientPromise;
}

function serializeCacheValue(value) {
  return JSON.stringify({ value });
}

function deserializeCacheValue(serializedValue) {
  try {
    const payload = JSON.parse(serializedValue);
    return payload?.value ?? null;
  } catch {
    return null;
  }
}

export function createMemoryCacheStore({
  defaultTtlMs = DEFAULT_CACHE_TTL_MS,
  cleanupIntervalMs = 5 * 60 * 1000,
} = {}) {
  const entries = new Map();
  let interval = null;

  const cleanupExpiredEntries = (now = Date.now()) => {
    for (const [cacheKey, entry] of entries.entries()) {
      if (now >= entry.expiresAt) {
        entries.delete(cacheKey);
      }
    }
  };

  if (cleanupIntervalMs > 0) {
    interval = setInterval(() => {
      cleanupExpiredEntries();
    }, cleanupIntervalMs);

    if (typeof interval.unref === "function") {
      interval.unref();
    }
  }

  return {
    kind: "memory",

    async get(cacheKey, now = Date.now()) {
      const entry = entries.get(cacheKey);

      if (!entry) {
        return miss();
      }

      if (now >= entry.expiresAt) {
        entries.delete(cacheKey);
        return miss();
      }

      return success(entry.value);
    },

    async set(cacheKey, value, ttlMs = defaultTtlMs) {
      entries.set(cacheKey, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
      return success(true);
    },

    async delete(cacheKey) {
      entries.delete(cacheKey);
      return success(true);
    },

    async cleanupExpiredEntries(now = Date.now()) {
      cleanupExpiredEntries(now);
    },

    async close() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
    },
  };
}

export function createRedisCacheStore({
  redisUrl = process.env.REDIS_URL,
  keyPrefix = DEFAULT_REDIS_PREFIX,
  defaultTtlMs = DEFAULT_CACHE_TTL_MS,
} = {}) {
  if (!redisUrl) {
    throw new Error("REDIS_URL is required to enable Redis cache storage");
  }

  return {
    kind: "redis",

    async get(cacheKey) {
      try {
        const client = await getSharedRedisClient(redisUrl);
        const value = await client.get(getRedisKey(keyPrefix, cacheKey));

        if (!value) {
          return miss();
        }

        const deserialized = deserializeCacheValue(value);
        return success(deserialized);
      } catch (err) {
        console.error("[cache] Redis get error:", err.message);
        return error(err, "get");
      }
    },

    async set(cacheKey, value, ttlMs = defaultTtlMs) {
      try {
        const client = await getSharedRedisClient(redisUrl);

        await client.set(
          getRedisKey(keyPrefix, cacheKey),
          serializeCacheValue(value),
          {
            PX: ttlMs,
          }
        );
        return success(true);
      } catch (err) {
        console.error("[cache] Redis set error:", err.message);
        return error(err, "set");
      }
    },

    async delete(cacheKey) {
      try {
        const client = await getSharedRedisClient(redisUrl);

        await client.del(getRedisKey(keyPrefix, cacheKey));
        return success(true);
      } catch (err) {
        console.error("[cache] Redis delete error:", err.message);
        return error(err, "delete");
      }
    },
  };
}

export function createCacheStore({
  driver = process.env.CACHE_STORE ?? DEFAULT_STORE_DRIVER,
  redisUrl = process.env.REDIS_URL,
  keyPrefix = DEFAULT_REDIS_PREFIX,
  defaultTtlMs = DEFAULT_CACHE_TTL_MS,
  cleanupIntervalMs,
} = {}) {
  const normalizedDriver = String(driver).toLowerCase();

  if (process.env.NODE_ENV === "production") {
    if (normalizedDriver === "memory") {
      throw new Error("CACHE_STORE=memory is not allowed in production");
    }
    if (!redisUrl) {
      console.warn("REDIS_URL is missing in production.");
    }
  }

  if (
    normalizedDriver === "redis" ||
    (normalizedDriver === "auto" && redisUrl)
  ) {
    return createRedisCacheStore({
      redisUrl,
      keyPrefix,
      defaultTtlMs,
    });
  }

  return createMemoryCacheStore({
    defaultTtlMs,
    cleanupIntervalMs,
  });
}

let _cacheStore;
export function getCacheStore() {
  if (!_cacheStore) {
    _cacheStore = createCacheStore();
  }
  return _cacheStore;
}
export const cacheStore = getCacheStore();