import "server-only";

export const DEFAULT_BUCKET_TTL_MS = 10 * 60 * 1000;

export function refillBucket(bucket, limitPerMinute, burstCapacity, now) {
  const elapsedMinutes = (now - bucket.lastRefillAt) / 60000;
  const refillAmount = elapsedMinutes * limitPerMinute;

  bucket.tokens = Math.min(burstCapacity, bucket.tokens + refillAmount);
  bucket.lastRefillAt = now;
}

const CHECK_AND_DEDUCT_SCRIPT = `
  local key = KEYS[1]
  local now = tonumber(ARGV[1])
  local limitPerMinute = tonumber(ARGV[2])
  local burstCapacity = tonumber(ARGV[3])
  local bucketTtlSeconds = tonumber(ARGV[4])

  local raw = redis.call('GET', key)
  local tokens = nil
  local lastRefillAt = now

  if raw then
    local bucket = cjson.decode(raw)
    if bucket and bucket.tokens then
      tokens = tonumber(bucket.tokens)
      lastRefillAt = tonumber(bucket.lastRefillAt)
    end
  end

  if not tokens then
    tokens = burstCapacity
    lastRefillAt = now
  end

  local elapsedMinutes = (now - lastRefillAt) / 60000
  tokens = math.min(burstCapacity, tokens + elapsedMinutes * limitPerMinute)
  lastRefillAt = now

  local allowed = 0
  local retryAfterSeconds = 0

  if tokens >= 1 then
    tokens = tokens - 1
    allowed = 1
  else
    local missingTokens = 1 - tokens
    if limitPerMinute > 0 then
      retryAfterSeconds = math.max(1, math.ceil((missingTokens / limitPerMinute) * 60))
    else
      retryAfterSeconds = 60
    end
  end

  local nextBucket = {
    tokens = tokens,
    lastRefillAt = lastRefillAt,
    limitPerMinute = limitPerMinute,
    burstCapacity = burstCapacity
  }

  redis.call('SET', key, cjson.encode(nextBucket), 'EX', bucketTtlSeconds)

  return {allowed, math.floor(tokens), retryAfterSeconds}
`;

export function createMemoryRateLimitStore({
  bucketTtlMs = DEFAULT_BUCKET_TTL_MS,
  cleanupIntervalMs = 60 * 1000,
} = {}) {
  const entries = new Map();
  let interval = null;

  const cleanupExpiredEntries = (now = Date.now()) => {
    for (const [key, bucket] of entries.entries()) {
      if (now >= bucket.lastRefillAt + bucketTtlMs) {
        entries.delete(key);
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

    async getBucket(key, now = Date.now()) {
      const bucket = entries.get(key);

      if (!bucket) {
        return null;
      }

      if (now >= bucket.lastRefillAt + bucketTtlMs) {
        entries.delete(key);
        return null;
      }

      return bucket;
    },

    async setBucket(key, bucket) {
      entries.set(key, bucket);
      return true;
    },

    async deleteBucket(key) {
      entries.delete(key);
      return true;
    },

    async checkAndDeduct(key, { limitPerMinute, burstCapacity, now = Date.now() }) {
      const bucket = entries.get(key);
      let tokens;
      let lastRefillAt;

      if (!bucket || now >= bucket.lastRefillAt + bucketTtlMs) {
        tokens = burstCapacity;
        lastRefillAt = now;
      } else {
        const elapsedMinutes = (now - bucket.lastRefillAt) / 60000;
        tokens = Math.min(burstCapacity, bucket.tokens + elapsedMinutes * limitPerMinute);
        lastRefillAt = now;
      }

      let allowed = false;
      let retryAfterSeconds = 0;

      if (tokens >= 1) {
        tokens -= 1;
        allowed = true;
      } else {
        const missingTokens = 1 - tokens;
        retryAfterSeconds = limitPerMinute > 0
          ? Math.max(1, Math.ceil((missingTokens / limitPerMinute) * 60))
          : 60;
      }

      entries.set(key, {
        tokens,
        lastRefillAt,
        limitPerMinute,
        burstCapacity,
      });

      return {
        allowed,
        remaining: Math.max(0, Math.floor(tokens)),
        retryAfterSeconds,
      };
    },

    async cleanupExpiredBuckets(now = Date.now()) {
      cleanupExpiredEntries(now);
    },

    async close() {
      if (interval) {
        clearInterval(interval);
        interval = null;
      }
      return true;
    },
  };
}

export async function getRedisClient(redisUrl) {
  if (!redisUrl) {
    throw new Error("redisUrl is required to get a Redis client");
  }

  const { createClient } = await import("redis");

  const client = createClient({
    url: redisUrl,
  });

  await client.connect();

  return client;
}

export function createRedisRateLimitStore({
  redisUrl = process.env.REDIS_URL,
  client,
  bucketTtlMs = DEFAULT_BUCKET_TTL_MS,
} = {}) {
  let resolvedClient = client;

  async function resolveClient() {
    if (!resolvedClient) {
      if (!redisUrl) {
        throw new Error("REDIS_URL is required to connect to Redis");
      }

      resolvedClient = await getRedisClient(redisUrl);
    }

    return resolvedClient;
  }

  return {
    kind: "redis",

    async getBucket(key, now = Date.now()) {
      try {
        const c = await resolveClient();
        const val = await c.get(key);

        if (!val) {
          return null;
        }

        const bucket = JSON.parse(val);

        if (now >= bucket.lastRefillAt + bucketTtlMs) {
          await c.del(key);
          return null;
        }

        return bucket;
      } catch (err) {
        console.error("Redis getBucket error:", err);
        return null;
      }
    },

    async setBucket(key, bucket) {
      try {
        const c = await resolveClient();
        await c.set(key, JSON.stringify(bucket), {
          PX: bucketTtlMs,
        });
        return true;
      } catch (err) {
        console.error("Redis setBucket error:", err);
        return false;
      }
    },

    async deleteBucket(key) {
      try {
        const c = await resolveClient();
        await c.del(key);
        return true;
      } catch (err) {
        console.error("Redis deleteBucket error:", err);
        return false;
      }
    },

    async checkAndDeduct(key, { limitPerMinute, burstCapacity, now = Date.now() }) {
      const c = await resolveClient();
      const bucketTtlSeconds = Math.ceil(bucketTtlMs / 1000);
      const result = await c.eval(CHECK_AND_DEDUCT_SCRIPT, {
        keys: [key],
        arguments: [
          String(now),
          String(limitPerMinute),
          String(burstCapacity),
          String(bucketTtlSeconds),
        ],
      });

      const allowed = result[0];
      const remaining = result[1];
      const retryAfterSeconds = result[2];

      return {
        allowed: allowed === 1 || allowed === true,
        remaining: Number(remaining),
        retryAfterSeconds: Number(retryAfterSeconds),
      };
    },

    async cleanupExpiredBuckets() {
      return undefined;
    },

    async close() {
      if (resolvedClient && !client) {
        await resolvedClient.disconnect();
      }
      return true;
    },
  };
}

export function createRateLimitStore({
  driver = process.env.RATE_LIMIT_STORE ?? "auto",
  redisUrl = process.env.REDIS_URL,
  client,
  bucketTtlMs = DEFAULT_BUCKET_TTL_MS,
  cleanupIntervalMs,
} = {}) {
  const normalizedDriver = String(driver).toLowerCase();

  if (process.env.NODE_ENV === "production") {
    if (normalizedDriver === "memory") {
      throw new Error("RATE_LIMIT_STORE=memory is not allowed in production");
    }

    if (!redisUrl && !client) {
      throw new Error("REDIS_URL is required in production when using Redis rate limiting");
    }
  }

  if (
    normalizedDriver === "redis" ||
    (normalizedDriver === "auto" && (redisUrl || client))
  ) {
    return createRedisRateLimitStore({
      redisUrl,
      client,
      bucketTtlMs,
    });
  }

  if (process.env.NODE_ENV === "production") { throw new Error("Rate limiting fallback to in-memory store is prohibited in production. A working Redis connection is required."); }
  console.warn("[rate-limit] Falling back to in-memory store. Set REDIS_URL for production use.");
  return createMemoryRateLimitStore({
    bucketTtlMs,
    cleanupIntervalMs,
  });
}

