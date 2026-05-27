import { expect, it } from "vitest";

import {
  getRateLimitIdentifier,
  enforceRateLimit,
  buildRateLimitResponse,
} from "../lib/rate-limit.js";

import { buildSseErrorResponse } from "../lib/prompt-guard.js";

it("getRateLimitIdentifier returns user identifier when userId provided", () => {
  const id = getRateLimitIdentifier(null, "user-123");
  expect(id.kind).toBe("user");
  expect(id.value).toBe("user-123");
});

it("getRateLimitIdentifier derives IP from forwarded header when no userId", () => {
  const req = new Request("http://localhost", {
    headers: { "x-forwarded-for": "203.0.113.5, 1.2.3.4" },
  });

  const id = getRateLimitIdentifier(req, null);
  expect(id.kind).toBe("ip");
  expect(id.value).toBe("203.0.113.5");
});

it("enforceRateLimit allows first request and blocks immediate second when burstCapacity=1", async () => {
  const req = new Request("http://localhost", {
    headers: { "x-forwarded-for": "198.51.100.7" },
  });

  const subject = getRateLimitIdentifier(req, null);
  const endpoint = "/test/rl";

  const first = await enforceRateLimit({ endpoint, subject, limitPerMinute: 1, burstCapacity: 1 });
  expect(first.allowed).toBe(true);

  const second = await enforceRateLimit({ endpoint, subject, limitPerMinute: 1, burstCapacity: 1 });
  expect(second.allowed).toBe(false);
  expect(typeof second.retryAfterSeconds === "number" && second.retryAfterSeconds >= 1).toBe(true);
});

it("buildRateLimitResponse returns SSE body and correct headers when sse=true", async () => {
  const res = buildRateLimitResponse({ message: "Too Many Requests", retryAfterSeconds: 10, sse: true });
  expect(res.status).toBe(429);
  expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  const text = await res.text();
  expect(text).toContain("event: error");
  expect(text).toContain("data:");
  const payloadLine = text.split("\n").find((line) => line.startsWith("data: "));
  expect(payloadLine).toBeTruthy();
  const payload = JSON.parse(payloadLine.slice(6));
  expect(payload.error).toBe("Too Many Requests");
  expect(payload.retryAfterSeconds).toBe(10);
});

it("buildSseErrorResponse streams an SSE error and terminates with [DONE]", async () => {
  const res = buildSseErrorResponse("Prompt is required", 400);
  expect(res.status).toBe(400);
  expect(res.headers.get("Content-Type")).toBe("text/event-stream");
  const text = await res.text();
  expect(text).toContain("data:");
  const payloadLine = text.split("\n").find((line) => line.startsWith("data: {"));
  expect(payloadLine).toBeTruthy();
  const payload = JSON.parse(payloadLine.slice(6));
  expect(payload.error).toBe("Prompt is required");
  expect(text).toContain("[DONE]");
});
