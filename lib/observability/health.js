import { getCacheStore } from "@/lib/cache/store.js";
import { getRedisClient } from "@/lib/rate-limit/store.js";

const dependencyChecks = {
  database: async () => {
    try {
      const { db } = await import("@/lib/db/prisma");
      await db.$queryRaw`SELECT 1`;
      return { healthy: true, latencyMs: 0 };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  },
  cache: async () => {
    try {
      const store = getCacheStore();
      const start = Date.now();
      await store.get("__health_check__");
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (error) {
      return { healthy: false, error: error.message };
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
      return { healthy: false, error: error.message };
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
      return { healthy: false, error: error.message };
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
      results[name] = { healthy: false, error: error.message };
      allHealthy = false;
    }
  }

  return {
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    dependencies: results,
  };
}

export function sanitizeHealth(health) {
  return {
    ...health,
    dependencies: Object.fromEntries(
      Object.entries(health.dependencies || {}).map(([name, dependency]) => [
        name,
        {
          healthy: Boolean(dependency?.healthy),
          ...(typeof dependency?.latencyMs === "number" ? { latencyMs: dependency.latencyMs } : {}),
          ...(dependency?.note ? { note: dependency.note } : {}),
          ...(!dependency?.healthy && !dependency?.note ? { error: "Dependency check failed" } : {}),
        },
      ])
    ),
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
