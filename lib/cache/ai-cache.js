import "server-only";
import { generateGeminiContent } from "../gemini.js";

import { getCacheStore } from "./store.js";
import { DEFAULT_CACHE_TTL_MS, generateCacheKey } from "./utils.js";

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

async function readCacheValue(cacheKey) {
  try {
    return await getCacheStore().get(cacheKey);
  } catch (error) {
    console.warn(`[cache] Cache read failed for key ${cacheKey}`, error);
    return null;
  }
}

async function writeCacheValue(cacheKey, payload, ttlMs) {
  try {
    await getCacheStore().set(cacheKey, payload, ttlMs);
  } catch (error) {
    console.warn(`[cache] Cache write failed for key ${cacheKey}`, error);
  }
}

export async function cachedGenerateGeminiContent(prompt, options = {}, cacheConfig = {}) {
  if (cacheConfig.enabled === false) {
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
      return hydrateCachedGeminiResult(cachedPayload);
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