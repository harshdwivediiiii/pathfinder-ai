import { describe, it, expect, beforeEach } from "vitest";
import { createLogger, formatEntry, LOG_LEVELS } from "@/lib/observability/logger";
import { createTraceContext, startSpan, Span } from "@/lib/observability/tracing";
import {
  metrics,
  getCacheHitRatio,
  incrementCacheHit,
  incrementCacheMiss,
  recordAiGenerationDuration,
  setCircuitBreakerState,
  recordError,
  recordRateLimitExceeded,
  getPrometheusMetrics,
  resetMetrics,
} from "@/lib/observability/metrics";

describe("Logger", () => {
  it("formats log entry as valid JSON", () => {
    const entry = formatEntry({
      level: "info",
      service: "test",
      message: "test message",
      context: { key: "value" },
    });
    const parsed = JSON.parse(entry);
    expect(parsed.level).toBe("info");
    expect(parsed.service).toBe("test");
    expect(parsed.message).toBe("test message");
    expect(parsed.context.key).toBe("value");
  });

  it("includes error information when present", () => {
    const err = new Error("test error");
    const entry = formatEntry({
      level: "error",
      service: "test",
      message: "failed",
      error: err,
    });
    const parsed = JSON.parse(entry);
    expect(parsed.error.name).toBe("Error");
    expect(parsed.error.message).toBe("test error");
  });

  it("creates logger functions that do not throw", () => {
    const logger = createLogger("test-service");
    expect(() => logger.info("msg")).not.toThrow();
    expect(() => logger.debug("msg")).not.toThrow();
    expect(() => logger.warn("msg")).not.toThrow();
    expect(() => logger.error("msg")).not.toThrow();
  });
});

describe("Tracing", () => {
  it("creates trace context with unique traceId", () => {
    const ctx = createTraceContext();
    expect(ctx.traceId).toBeDefined();
    expect(typeof ctx.traceId).toBe("string");
  });

  it("creates span with name and parentSpanId", () => {
    const span = startSpan("test-op", "parent-123");
    expect(span.name).toBe("test-op");
    expect(span.parentSpanId).toBe("parent-123");
    expect(span.spanId).toBeDefined();
  });

  it("end span records duration", () => {
    const span = startSpan("test-op");
    span.end();
    expect(span.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("sets and retrieves span attributes", () => {
    const span = startSpan("test-op");
    span.setAttribute("key", "value");
    expect(span.attributes.key).toBe("value");
  });
});

describe("Metrics", () => {
  beforeEach(() => {
    resetMetrics();
  });

  it("tracks cache hit ratio", () => {
    incrementCacheHit();
    incrementCacheHit();
    incrementCacheMiss();
    expect(getCacheHitRatio()).toBeCloseTo(2 / 3);
  });

  it("initial cache hit ratio is 0", () => {
    expect(getCacheHitRatio()).toBe(0);
  });

  it("records AI generation duration", () => {
    recordAiGenerationDuration(0.5, { cacheHit: true });
    expect(metrics.aiGenerationDurationSeconds.values.length).toBe(1);
  });

  it("tracks circuit breaker state", () => {
    setCircuitBreakerState("closed");
    setCircuitBreakerState("open");
    expect(metrics.circuitBreakerState.closed).toBe(1);
    expect(metrics.circuitBreakerState.open).toBe(1);
  });

  it("records errors", () => {
    recordError();
    expect(metrics.errorCountTotal).toBe(1);
  });

  it("records rate limit violations", () => {
    recordRateLimitExceeded();
    expect(metrics.rateLimitExceededTotal).toBe(1);
  });

  it("generates valid Prometheus metrics format", () => {
    incrementCacheHit();
    const output = getPrometheusMetrics();
    expect(output).toContain("cache_hit_ratio");
    expect(output).toContain("# TYPE");
    expect(output).toContain("# HELP");
  });

  it("resetMetrics clears all counters", () => {
    incrementCacheHit();
    recordError();
    resetMetrics();
    expect(getCacheHitRatio()).toBe(0);
    expect(metrics.errorCountTotal).toBe(0);
  });
});