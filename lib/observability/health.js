import { getCacheStore } from "@/lib/cache/store.js";
import { getRedisClient } from "@/lib/rate-limit/store.js";

/**
 * Sanitizes a dependency-check failure for the public health endpoint.
 * The full error is logged server-side; only a redacted, truncated message
 * is returned so internal details (connection strings, keys, model names)
 * never reach unauthenticated callers.
 */
function sanitizeDependencyError(name, error) {
  console.error(`[health] ${name} check failed:`, error);
  const raw = error instanceof Error ? error.message : String(error);
  return raw
    .replace(/postgres(?:ql)?:\/\/[^@\s]+@[^\s]+/g, "postgresql://****:****@****")
    .replace(/(rediss?|mongodb|mysql):\/\/[^@\s]+@[^\s]+/g, "$1://****:****@****")
    .replace(/password=[^&\s]+/g, "password=****")
    .replace(/\b(api[\s_-]*key|token|secret)\s*[=:]\s*[^\s,;&]+/gi, "$1=****")
    .slice(0, 200);
}

function dependencyError(name, error) {
  return { healthy: false, error: sanitizeDependencyError(name, error) };
}

const dependencyChecks = {
  database: async () => {
    try {
      const { db } = await import("@/lib/db/prisma");
      await db.$queryRaw`SELECT 1`;
      return { healthy: true, latencyMs: 0 };
    } catch (error) {
      return dependencyError("database", error);
    }
  },
  cache: async () => {
    try {
      const store = getCacheStore();
      const start = Date.now();
      await store.get("__health_check__");
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return dependencyError("cache", error);
    }
  },
  redis: async () => {
    try {
      const redisUrl = process.env.REDIS_URL;
      if (!redisUrl) return { healthy: true, note: "Redis not configured, skipping" };
      const start = Date.now();
      const client = await getRedisClient(redisUrl);
      await client.ping();
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return dependencyError("redis", error);
    }
  },
  ai: async () => {
    try {
      const start = Date.now();
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return { healthy: false, error: "GEMINI_API_KEY not configured" };
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("ping");
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return dependencyError("ai", error);
    }
  },
};

export async function checkHealth() {
  const results = {};
  let allHealthy = true;

  for (const [name, check] of Object.entries(dependencyChecks)) {
    try {
      results[name] = await check();
      if (!results[name].healthy) {
        allHealthy = false;
      }
    } catch (error) {
      results[name] = dependencyError(name, error);
      allHealthy = false;
    }
  }

  return {
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    dependencies: results,
  };
}

export async function checkReadiness() {
  const health = await checkHealth();
  const allDependenciesHealthy = Object.values(health.dependencies).every(
    (dep) => dep.healthy || dep.note
  );

  if (!allDependenciesHealthy) {
    return { ready: false, health };
  }

  return { ready: true, health };
}
