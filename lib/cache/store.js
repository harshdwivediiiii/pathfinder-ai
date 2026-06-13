import "server-only";
import { getRedisClient } from "../rate-limit/store.js";
import { DEFAULT_CACHE_TTL_MS } from "./utils.js";

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
        return null;
      }

      if (now >= entry.expiresAt) {
        entries.delete(cacheKey);
        return null;
      }

      return entry.value;
    },

    async set(cacheKey, value, ttlMs = defaultTtlMs) {
      entries.set(cacheKey, {
        value,
        expiresAt: Date.now() + ttlMs,
      });
    },

    async delete(cacheKey) {
      entries.delete(cacheKey);
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
      const client = await getSharedRedisClient(redisUrl);
      const value = await client.get(getRedisKey(keyPrefix, cacheKey));

      if (!value) {
        return null;
      }

      return deserializeCacheValue(value);
    },

    async set(cacheKey, value, ttlMs = defaultTtlMs) {
      const client = await getSharedRedisClient(redisUrl);

      await client.set(
        getRedisKey(keyPrefix, cacheKey),
        serializeCacheValue(value),
        {
          PX: ttlMs,
        }
      );
    },

    async delete(cacheKey) {
      const client = await getSharedRedisClient(redisUrl);

      await client.del(getRedisKey(keyPrefix, cacheKey));
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