import assert from "node:assert/strict";
import test from "node:test";

import {
  getRateLimitIdentifier,
  enforceRateLimit,
  buildRateLimitResponse,
} from "../lib/rate-limit.js";

import { buildSseErrorResponse } from "../lib/prompt-guard.js";

test("getRateLimitIdentifier returns user identifier when userId provided", () => {
  const id = getRateLimitIdentifier(null, "user-123");
  assert.equal(id.kind, "user");
  assert.equal(id.value, "user-123");
});

test("getRateLimitIdentifier derives IP from forwarded header when no userId", () => {
  const req = new Request("http://localhost", {
    headers: { "x-forwarded-for": "203.0.113.5, 1.2.3.4" },
  });

  const id = getRateLimitIdentifier(req, null);
  assert.equal(id.kind, "ip");
  assert.equal(id.value, "203.0.113.5");
});

test("enforceRateLimit allows first request and blocks immediate second when burstCapacity=1", async () => {
  const req = new Request("http://localhost", {
    headers: { "x-forwarded-for": "198.51.100.7" },
  });

  const subject = getRateLimitIdentifier(req, null);
  const endpoint = "/test/rl";

  const first = await enforceRateLimit({ endpoint, subject, limitPerMinute: 1, burstCapacity: 1 });
  assert.equal(first.allowed, true);

  const second = await enforceRateLimit({ endpoint, subject, limitPerMinute: 1, burstCapacity: 1 });
  assert.equal(second.allowed, false);
  assert.ok(typeof second.retryAfterSeconds === "number" && second.retryAfterSeconds >= 1);
});

test("buildRateLimitResponse returns SSE body and correct headers when sse=true", async () => {
  const res = buildRateLimitResponse({ message: "Too Many Requests", retryAfterSeconds: 10, sse: true });
  assert.equal(res.status, 429);
  assert.equal(res.headers.get("Content-Type"), "text/event-stream");
  const text = await res.text();
  assert.ok(text.includes("data:"));
  const payloadLine = text.split("\n").find((line) => line.startsWith("data: "));
  assert.ok(payloadLine);
  const payload = JSON.parse(payloadLine.slice(6));
  assert.equal(payload.error, "Too Many Requests");
  assert.equal(payload.retryAfterSeconds, 10);
});

test("buildSseErrorResponse streams an SSE error and terminates with [DONE]", async () => {
  const res = buildSseErrorResponse("Prompt is required", 400);
  assert.equal(res.status, 400);
  assert.equal(res.headers.get("Content-Type"), "text/event-stream");
  const text = await res.text();
  assert.ok(text.includes('data:'));
  const payloadLine = text.split("\n").find((line) => line.startsWith("data: {"));
  assert.ok(payloadLine);
  const payload = JSON.parse(payloadLine.slice(6));
  assert.equal(payload.error, "Prompt is required");
  assert.ok(text.includes("[DONE]"));
});
