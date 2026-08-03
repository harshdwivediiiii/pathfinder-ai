import "server-only";
import { generateGeminiContent } from "../ai/gemini";

import { getCacheStore } from "./store.js";
import { DEFAULT_CACHE_TTL_MS, generateCacheKey } from "./utils.js";
import { unwrap, isSuccess, isError } from "../db/redis-result";

const inFlightRequests = new Map();

function extractGeminiText(result) {
  const rawText = result?.response?.text?.() ?? result?.response?.text;

  if (rawText == null) {
    return "";
  }

  return typeof rawText === "string" ? rawText : String(rawText);
}

function hydrateCachedGeminiResult(payload) {
  const responseText = payload?.responseText ?? "";
  const candidates = Array.isArray(payload?.responseCandidates) ? payload.responseCandidates : [];
  const response = {
    candidates,
    text: () => responseText,
  };

  if (payload?.responsePromptFeedback) {
    response.promptFeedback = payload.responsePromptFeedback;
  }

  return { response };
}

function isValidGeminiCachePayload(payload) {
  if (!payload || typeof payload !== "object") return false;
  const hasText = typeof payload.responseText === "string" && payload.responseText.trim().length > 0;
  const hasCandidates = Array.isArray(payload.responseCandidates) && payload.responseCandidates.length > 0;
  return hasText || hasCandidates;
}

async function readCacheValue(cacheKey) {
  try {
    const result = await getCacheStore().get(cacheKey);
    if (isError(result)) {
      console.warn(`[cache] Cache read failed for key ${cacheKey}:`, result.error?.message);
      return null;
    }
    return unwrap(result);
  } catch (error) {
    console.warn(`[cache] Cache read failed for key ${cacheKey}`, error);
    return null;
  }
}

async function invalidateCacheValue(cacheKey) {
  try {
    const result = await getCacheStore().delete(cacheKey);
    if (isError(result)) {
      console.warn(`[cache] Failed to invalidate cache entry for key ${cacheKey}:`, result.error?.message);
    }
  } catch (error) {
    console.warn(`[cache] Failed to invalidate cache entry for key ${cacheKey}`, error);
  }
}

async function writeCacheValue(cacheKey, payload, ttlMs) {
  try {
    const result = await getCacheStore().set(cacheKey, payload, ttlMs);
    // Log if Redis write failed for observability, but don't block
    if (isError(result)) {
      console.warn(`[cache] Redis write failed for key ${cacheKey}:`, result.error?.message);
    }
  } catch (error) {
    console.warn(`[cache] Cache write failed for key ${cacheKey}`, error);
  }
}

export async function cachedGenerateGeminiContent(prompt, options = {}, cacheConfig = {}) {
  if (cacheConfig.enabled !) {
    return await generateGeminiContent(prompt, options);
  }

  const cacheKey = cacheConfig.key ?? generateCacheKey("gemini", prompt, options);
  const ttlMs = cacheConfig.ttl ?? DEFAULT_CACHE_TTL_MS;

  const inFlight = inFlightRequests.get(cacheKey);
  if (inFlight) {
    return await inFlight;
  }

  const requestPromise = (async () => {
    const cachedPayload = await readCacheValue(cacheKey);
    if (cachedPayload) {
      if (isValidGeminiCachePayload(cachedPayload)) {
        return hydrateCachedGeminiResult(cachedPayload);
      }
      // Corrupt or empty payload — invalidate and regenerate instead of
      // hydrating to empty text.
      console.warn(`[cache] Invalid cached payload for key ${cacheKey}, regenerating`);
      await invalidateCacheValue(cacheKey);
    }

    const liveResult = await generateGeminiContent(prompt, options);
    const responseText = extractGeminiText(liveResult);
    const payload = {
      responseText,
      responseCandidates: liveResult?.response?.candidates ?? [],
      responsePromptFeedback: liveResult?.response?.promptFeedback,
    };

    await writeCacheValue(cacheKey, payload, ttlMs);
    return liveResult;
  })();

  inFlightRequests.set(cacheKey, requestPromise);

  try {
    return await requestPromise;
  } finally {
    inFlightRequests.delete(cacheKey);
  }
}