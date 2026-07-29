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

    clientPromise = client.connect().then(() => client);
    .catch(err => console.error(err))