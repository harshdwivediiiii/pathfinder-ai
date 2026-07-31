const metrics = {
  requestDurationSeconds: { buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5], values: [] },
  aiGenerationDurationSeconds: { buckets: [0.1, 0.25, 0.5, 1, 2, 5, 10], values: [] },
  cacheHitRatio: { hits: 0, misses: 0 },
  circuitBreakerState: { closed: 0, halfOpen: 0, open: 0 },
  errorCountTotal: 0,
  rateLimitExceededTotal: 0,
  sessionCountActive: 0,
  dbQueryCountTotal: 0,
};

function getCacheHitRatio() {
  const total = metrics.cacheHitRatio.hits + metrics.cacheHitRatio.misses;
  if (total === 0) return 0;
  return metrics.cacheHitRatio.hits / total;
}

function recordRequestDuration(durationSeconds, labels = {}) {
  metrics.requestDurationSeconds.values.push({ duration: durationSeconds, ...labels });
}

function recordAiGenerationDuration(durationSeconds, labels = {}) {
  metrics.aiGenerationDurationSeconds.values.push({ duration: durationSeconds, ...labels });
}

function incrementCacheHit() {
  metrics.cacheHitRatio.hits += 1;
}

function incrementCacheMiss() {
  metrics.cacheHitRatio.misses += 1;
}

function setCircuitBreakerState(state) {
  metrics.circuitBreakerState[state] = (metrics.circuitBreakerState[state] ?? 0) + 1;
}

function recordError(labels = {}) {
  metrics.errorCountTotal += 1;
}

function recordRateLimitExceeded(labels = {}) {
  metrics.rateLimitExceededTotal += 1;
}

function recordDbQuery(labels = {}) {
  metrics.dbQueryCountTotal += 1;
}

function getPrometheusMetrics() {
  const lines = [];
  lines.push("# HELP request_duration_seconds Duration of HTTP requests in seconds");
  lines.push("# TYPE request_duration_seconds histogram");
  for (const v of metrics.requestDurationSeconds.values) {
    for (const bucket of metrics.requestDurationSeconds.buckets) {
      lines.push(`request_duration_seconds_bucket{le="${bucket}",route="${v.route ?? "unknown"}",method="${v.method ?? "unknown"}",status_code="${v.status_code ?? "unknown"}"} ${v.duration <= bucket ? 1 : 0}`);
    }
    lines.push(`request_duration_seconds_count{route="${v.route ?? "unknown"}",method="${v.method ?? "unknown"}"} 1`);
    lines.push(`request_duration_seconds_sum{route="${v.route ?? "unknown"}",method="${v.method ?? "unknown"}"} ${v.duration}`);
  }

  lines.push("# HELP cache_hit_ratio Current cache hit ratio");
  lines.push("# TYPE cache_hit_ratio gauge");
  lines.push(`cache_hit_ratio ${getCacheHitRatio()}`);

  lines.push("# HELP circuit_breaker_state Current state of circuit breakers (0=closed,1=half-open,2=open)");
  lines.push("# TYPE circuit_breaker_state gauge");
  lines.push(`circuit_breaker_state{state="closed"} ${metrics.circuitBreakerState.closed}`);
  lines.push(`circuit_breaker_state{state="half_open"} ${metrics.circuitBreakerState.halfOpen}`);
  lines.push(`circuit_breaker_state{state="open"} ${metrics.circuitBreakerState.open}`);

  lines.push("# HELP error_count_total Total number of errors");
  lines.push("# TYPE error_count_total counter");
  lines.push(`error_count_total ${metrics.errorCountTotal}`);

  lines.push("# HELP rate_limit_exceeded_total Total number of rate limit violations");
  lines.push("# TYPE rate_limit_exceeded_total counter");
  lines.push(`rate_limit_exceeded_total ${metrics.rateLimitExceededTotal}`);

  return lines.join("\n");
}

function resetMetrics() {
  metrics.requestDurationSeconds.values = [];
  metrics.aiGenerationDurationSeconds.values = [];
  metrics.cacheHitRatio = { hits: 0, misses: 0 };
  metrics.circuitBreakerState = { closed: 0, halfOpen: 0, open: 0 };
  metrics.errorCountTotal = 0;
  metrics.rateLimitExceededTotal = 0;
  metrics.sessionCountActive = 0;
  metrics.dbQueryCountTotal = 0;
}

export {
  metrics,
  getCacheHitRatio,
  recordRequestDuration,
  recordAiGenerationDuration,
  incrementCacheHit,
  incrementCacheMiss,
  setCircuitBreakerState,
  recordError,
  recordRateLimitExceeded,
  recordDbQuery,
  getPrometheusMetrics,
  resetMetrics,
};
