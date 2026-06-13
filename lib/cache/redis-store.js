import "server-only";

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
        return value ?? null;
      } catch (error) {
        console.error("[cache] Redis get error:", error);
        return null;
      }
    },

    async set(key, value, customTtlMs = ttlMs) {
      try {
        const client = await getRedisClient(redisUrl);
        await client.set(`${keyPrefix}:${key}`, value, { PX: customTtlMs });
      } catch (error) {
        console.error("[cache] Redis set error:", error);
      }
    },

    async delete(key) {
      try {
        const client = await getRedisClient(redisUrl);
        await client.del(`${keyPrefix}:${key}`);
      } catch (error) {
        console.error("[cache] Redis delete error:", error);
      }
    },
  };
}
