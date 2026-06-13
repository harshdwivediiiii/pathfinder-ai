import "server-only";
import {
  getPendingRequest,
  setPendingRequest,
  deletePendingRequest,
} from "./pending-requests";
import { getCacheStore } from "./store.js";
import { DEFAULT_CACHE_TTL_MS, generateCacheKey } from "./utils.js";

const CACHE_TTL = 1000 * 60 * 10;

function buildCacheKey(userId, prompt) {
  return generateCacheKey("ai", userId, prompt);
}

export async function getCachedResponse(userId, prompt) {
  const key = buildCacheKey(userId, prompt);

  try {
    return await getCacheStore().get(key);
  } catch (error) {
    console.warn("[cache] Failed to read cached response", error);
    return null;
  }
}

export async function cacheResponse(userId, prompt, response) {
  if (!response) return;

  const key = buildCacheKey(userId, prompt);

  const store = getCacheStore();

  // store.set may be sync (memory) or async (redis). Support both.
  const result = store.set(key, response, CACHE_TTL);

  if (result?.then) {
    await result;
  }
}

export function getPendingGenerationRequest(userId, prompt) {
  const key = buildCacheKey(userId, prompt);
  return getPendingRequest(key);
}

export function setPendingGenerationRequest(userId, prompt, promise) {
  const key = buildCacheKey(userId, prompt);
  return setPendingRequest(key, promise);
}
export async function deletePendingGenerationRequest(
  userId,
  prompt,
  response
) {
  const key = buildCacheKey(userId, prompt);

  deletePendingRequest(key);

  if (!response) return;

  try {
    await getCacheStore().set(key, response, DEFAULT_CACHE_TTL_MS);
  } catch (error) {
    console.warn("[cache] Failed to store cached response", error);
  }
}