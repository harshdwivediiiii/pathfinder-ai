import "server-only";

export { getCachedResponse, cacheResponse } from "./cache-service";
export { getPendingRequest, setPendingRequest, deletePendingRequest, withRequestDeduplication } from "./pending-requests";
export {
  getCacheStore,
  createCacheStore,
  createMemoryCacheStore,
  createRedisCacheStore
} from "./store.js";
export { cachedGenerateGeminiContent } from "./ai-cache.js";

export {
  ATS_ANALYSIS_CACHE_TTL_MS,
  DEFAULT_CACHE_TTL_MS,
  generateCacheKey,
  hashString,
  INDUSTRY_INSIGHT_CACHE_TTL_MS,
  QUIZ_CACHE_TTL_MS,
  RESUME_IMPROVEMENT_CACHE_TTL_MS,
} from "./utils.js";
