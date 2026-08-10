import { generateGeminiContent, generateGeminiContentStream } from "@/lib/ai/gemini";
import { getCircuitBreaker, CircuitBreakerOpenError } from "@/lib/cache/circuit-breaker";
import { getCachedResponse, cacheResponse, getPendingGenerationRequest, setPendingGenerationRequest, deletePendingGenerationRequest, getOrCreatePendingRequest } from "@/lib/cache/cache-service";
import { createLogger } from "@/lib/observability/logger";
import { createTraceContext, startSpan } from "@/lib/observability/tracing";
import { incrementCacheHit, incrementCacheMiss, recordAiGenerationDuration, setCircuitBreakerState, recordError } from "@/lib/observability/metrics";
import { DEFAULT_CACHE_TTL_MS } from "@/lib/cache/utils";
import { extractGeminiText } from "./gemini";

const logger = createLogger("ai-pipeline");
const circuitBreaker = getCircuitBreaker("gemini-api", {
  failureThreshold: Number.parseInt(process.env.CIRCUIT_FAILURE_THRESHOLD ?? "5", 10),
  resetTimeoutMs: Number.parseInt(process.env.CIRCUIT_RESET_TIMEOUT_MS ?? "30000", 10),
  rollingWindowMs: Number.parseInt(process.env.CIRCUIT_ROLLING_WINDOW_MS ?? "60000", 10),
});

function extractText(result) {
  return result?.response?.text?.() ?? result?.response?.text ?? "";
}

async function withRetry(operation, maxRetries = 3, baseDelayMs = 1000) {
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const delayMs = baseDelayMs * Math.pow(2, attempt - 1) + Math.random() * baseDelayMs;
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      logger.warn(`Retry attempt ${attempt}/${maxRetries} after ${Math.round(delayMs)}ms`);
    }

    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const isRetryable =
        error instanceof CircuitBreakerOpenError ||
        error?.code === "RATE_LIMITED" ||
        error?.status === 429 ||
        error?.status >= 500 ||
        (error?.name === "GeminiError" && error?.code === "TIMEOUT") ||
        error?.message?.includes("ECONNRESET") ||
        error?.message?.includes("ETIMEDOUT");

      if (!isRetryable || attempt === maxRetries) {
        break;
      }
    }
  }

  throw lastError;
}

export async function runAiGeneration(prompt, options = {}) {
  const traceContext = options.traceContext ?? createTraceContext();
  const userId = options.userId ?? "anonymous";
  const span = startSpan("ai-generation", traceContext.parentSpanId);
  span.setAttribute("prompt.fingerprint", options.fingerprint ?? "unknown");
  span.setAttribute("userId", userId);

  try {
    const cached = await getCachedResponse(userId, prompt, options.generationConfig);
    if (cached) {
      incrementCacheHit();
      span.setAttribute("cache.hit", true);
      span.end();
      logger.info("Cache hit for prompt", { userId, fingerprint: options.fingerprint });
      return cached;
    }

    incrementCacheMiss();
    span.setAttribute("cache.hit", false);

    const result = await circuitBreaker.execute(() =>
      withRetry(() => generateGeminiContent(prompt, options), 3)
    );

    const text = extractText(result);
    await cacheResponse(userId, prompt, text, options.generationConfig);
    span.setAttribute("cache.hit", false);
    span.end();

    return text;
  } catch (error) {
    recordError({ type: "ai-generation", source: "runAiGeneration" });
    logger.error("AI generation failed", { userId, fingerprint: options.fingerprint }, error);

    const degradedCache = await getCachedResponse(userId, prompt, options.generationConfig);
    if (degradedCache) {
      logger.warn("Serving degraded cached response after failure", { userId });
      setCircuitBreakerState("degraded");
      return degradedCache;
    }

    throw error;
  }
}

export async function runAiGenerationStream(prompt, options = {}) {
  const traceContext = options.traceContext ?? createTraceContext();
  const userId = options.userId ?? "anonymous";
  const span = startSpan("ai-generation-stream", traceContext.parentSpanId);
  span.setAttribute("prompt.fingerprint", options.fingerprint ?? "unknown");
  span.setAttribute("userId", userId);
  const startTime = Date.now();

  try {
    const cached = await getCachedResponse(userId, prompt, options.generationConfig);
    if (cached) {
      incrementCacheHit();
      span.setAttribute("cache.hit", true);
      span.end();
      logger.info("Cache hit (stream) for prompt", { userId, fingerprint: options.fingerprint });
      return { cached: true, text: cached, source: "cache" };
    }

    incrementCacheMiss();
    span.setAttribute("cache.hit", false);

    const stream = await circuitBreaker.execute(() =>
      withRetry(() => generateGeminiContentStream(prompt, options), 3)
    );

    span.setAttribute("streaming", true);
    const result = stream;
    let fullText = "";

    const originalOnChunk = options.onChunk;
    const wrappedStream = {
      ...stream,
      stream: (async function* () {
        for await (const chunk of result.stream) {
          const text = extractGeminiText(chunk);
          if (text) {
            fullText += text;
            if (originalOnChunk) originalOnChunk(text);
          }
          yield chunk;
        }
      })(),
    };

    const finalize = async () => {
      if (fullText.trim()) {
        await cacheResponse(userId, prompt, fullText, options.generationConfig);
      }
      const durationMs = Date.now() - startTime;
      recordAiGenerationDuration(durationMs / 1000, { cacheHit: false });
      span.setAttribute("durationMs", durationMs);
      span.end();
      logger.info("Stream generation completed", { userId, durationMs, fingerprint: options.fingerprint });
    };

    const errorHandler = async (error) => {
      recordError({ type: "ai-generation-stream", source: "runAiGenerationStream" });
      const degradedCache = await getCachedResponse(userId, prompt, options.generationConfig);
      const durationMs = Date.now() - startTime;
      recordAiGenerationDuration(durationMs / 1000, { cacheHit: false, error: true });
      if (degradedCache) {
        logger.warn("Serving degraded cached response after stream failure", { userId });
        setCircuitBreakerState("degraded");
        span.end();
        return { cached: true, text: degradedCache, source: "degraded-cache" };
      }
      span.end();
      logger.error("Stream generation failed", { userId, durationMs }, error);
      throw error;
    };

    // runAiGenerationStream resolves to either a stream handle ({ stream, finalize, errorHandler })
    // or a cached-text object ({ cached, text, source }) when a degraded cache entry is served.
    return { stream: wrappedStream, finalize, errorHandler };
  } catch (error) {
    recordError({ type: "ai-generation-stream", source: "runAiGenerationStream" });
    const degradedCache = await getCachedResponse(userId, prompt, options.generationConfig);
    if (degradedCache) {
      logger.warn("Serving degraded cached response after stream failure", { userId });
      setCircuitBreakerState("degraded");
      return { cached: true, text: degradedCache, source: "degraded-cache" };
    }

    const durationMs = Date.now() - startTime;
    recordAiGenerationDuration(durationMs / 1000, { cacheHit: false, error: true });
    span.end();
    setCircuitBreakerState("open");
    logger.error("AI generation stream failed", { userId, durationMs }, error);
    throw error;
  }
}

export { circuitBreaker };