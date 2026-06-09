import { createPromptFingerprint } from "./fingerprint";
import {
  getPendingRequest,
  setPendingRequest,
  deletePendingRequest,
} from "./pending-requests";

const CACHE_TTL = 1000 * 60 * 10;
import { cacheStore } from "./store.js";
import { DEFAULT_CACHE_TTL_MS, generateCacheKey } from "./utils.js";

export function buildCacheKey(userId, prompt) {
  return generateCacheKey("ai", userId, prompt);
}

export async function getCachedResponse(userId, prompt) {
  const key = buildCacheKey(userId, prompt);

  try {
    return await cacheStore.get(key);
  } catch (error) {
    console.warn("[cache] Failed to read cached response", error);
    return null;
  }
}

export async function cacheResponse(userId, prompt, response) {
  if (!response) return;

  const key = buildCacheKey(userId, prompt);

  cacheStore.set(key, response, CACHE_TTL);
}

export function getPendingGenerationRequest(userId, prompt) {
  const key = buildCacheKey(userId, prompt);
  return getPendingRequest(key);
}

export async function deletePendingGenerationRequest(
  userId,
  prompt,
  response
) {
  const key = buildCacheKey(userId, prompt);

  deletePendingRequest(key);

  try {
    await cacheStore.set(key, response, DEFAULT_CACHE_TTL_MS);
  } catch (error) {
    console.warn("[cache] Failed to store cached response", error);
  }
}