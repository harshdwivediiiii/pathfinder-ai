import {
  getPendingRequest,
  setPendingRequest,
  deletePendingRequest,
  getOrCreatePendingRequest,
} from "./pending-requests";
import { getCacheStore } from "./store.js";
import { DEFAULT_CACHE_TTL_MS, generateCacheKey } from "./utils.js";
import { unwrap } from "../db/redis-result";

const CACHE_TTL = 1000 * 60 * 10;

/**
 * Build a cache key for AI responses.
 * Includes generation parameters (model, temperature, etc.) in the key
 * so that different generation configs do not collide on the same cache entry.
 *
 * @param {string} userId - The authenticated user ID
 * @param {string} prompt - The prompt string
 * @param {object} [generationParams] - Optional generation parameters (model, temperature, etc.)
 * @returns {string} Cache key
 */
function buildCacheKey(userId, prompt, generationParams) {
  if (generationParams) {
    const { model, temperature, topP, topK, maxOutputTokens, responseMimeType, ...rest } = generationParams;
    return generateCacheKey("ai", userId, prompt, {
      model: model ?? null,
      temperature: temperature ?? null,
      topP: topP ?? null,
      topK: topK ?? null,
      maxOutputTokens: maxOutputTokens ?? null,
      responseMimeType: responseMimeType ?? null,
    });
  }
  return generateCacheKey("ai", userId, prompt);
}

export async function getCachedResponse(userId, prompt, generationParams) {
  const key = buildCacheKey(userId, prompt, generationParams);

  try {
    const result = await getCacheStore().get(key);
    const value = unwrap(result);

    if (typeof value === "string" && value.trim()) {
      return value;
    }

    if (value != null) {
      // Corrupt or empty payload — invalidate so it can be regenerated
      // instead of returning blank AI output.
      console.warn("[cache] Invalid cached response payload, invalidating entry");
      try {
        await getCacheStore().delete(key);
      } catch (error) {
        console.warn("[cache] Failed to invalidate corrupt cached response", error);
      }
    }

    return null;
  } catch (error) {
    console.warn("[cache] Failed to read cached response", error);
    return null;
  }
}

export async function cacheResponse(userId, prompt, response, generationParams) {
  if (!response) return;

  const key = buildCacheKey(userId, prompt, generationParams);

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

export function getOrCreatePendingGenerationRequest(userId, prompt) {
  const key = buildCacheKey(userId, prompt);
  return getOrCreatePendingRequest(key);
}
export { getOrCreatePendingRequest };

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