// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";

import {
  ERROR_CODES,
  respondSseError,
  respondSseRateLimitError,
  respondError,
  createErrorResponse,
  ApiError,
} from "../lib/api/error-handler.js";

afterEach(() => {
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.CORS_ORIGIN;
});

function makeRequest(origin) {
  const headers = origin ? { origin } : {};
  return new Request("http://localhost:3000/api/generate", { headers });
}

// ─── respondSseError CORS tests ───────────────────────────────────

it("respondSseError respects CORS policy for allowed same-origin requests", async () => {
  const request = makeRequest("http://localhost:3000");
  const res = respondSseError(request, ERROR_CODES.UNAUTHORIZED);

  expect(res.status).toBe(401);
  expect(res.headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8");
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
});

it("respondSseError omits ACAO header when request has no origin (no CORS needed)", async () => {
  const request = makeRequest(null);
  const res = respondSseError(request, ERROR_CODES.UNAUTHORIZED);

  expect(res.status).toBe(401);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
});

it("respondSseError returns ACAO for configured cross-origin origins", async () => {
  process.env.ALLOWED_ORIGINS = "https://app.example.com";
  const request = makeRequest("https://app.example.com");
  const res = respondSseError(request, ERROR_CODES.UNAUTHORIZED);

  expect(res.status).toBe(401);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe("https://app.example.com");
});

it("respondSseError does not leak ACAO:* for disallowed origins", async () => {
  const request = makeRequest("https://evil.example");
  const res = respondSseError(request, ERROR_CODES.UNAUTHORIZED);

  expect(res.status).toBe(401);
  // Disallowed origins get no CORS headers (not *)
  expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
});

it("respondSseError handles null request gracefully", async () => {
  const res = respondSseError(null, ERROR_CODES.UNAUTHORIZED);

  expect(res.status).toBe(401);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
});

it("respondSseError includes CORS methods and headers for allowed origins", async () => {
  const request = makeRequest("http://localhost:3000");
  const res = respondSseError(request, ERROR_CODES.UNAUTHORIZED);

  expect(res.headers.get("Access-Control-Allow-Methods")).toBe("POST, OPTIONS");
  expect(res.headers.get("Access-Control-Allow-Headers")).toBe("Content-Type, Authorization");
});

it("respondSseError returns correct status codes for different error codes", async () => {
  const request = makeRequest("http://localhost:3000");

  const tests = [
    { code: ERROR_CODES.VALIDATION_ERROR, expected: 400 },
    { code: ERROR_CODES.UNAUTHORIZED, expected: 401 },
    { code: ERROR_CODES.USER_NOT_FOUND, expected: 404 },
    { code: ERROR_CODES.RESOURCE_NOT_FOUND, expected: 404 },
    { code: ERROR_CODES.RATE_LIMIT_EXCEEDED, expected: 429 },
    { code: ERROR_CODES.PAYLOAD_TOO_LARGE, expected: 413 },
    { code: ERROR_CODES.AI_SERVICE_ERROR, expected: 502 },
    { code: ERROR_CODES.DATABASE_ERROR, expected: 500 },
    { code: ERROR_CODES.INTERNAL_SERVER_ERROR, expected: 500 },
  ];

  for (const { code, expected } of tests) {
    const res = respondSseError(request, code);
    expect(res.status).toBe(expected);
  }
});

it("respondSseError includes custom message in SSE body", async () => {
  const request = makeRequest("http://localhost:3000");
  const res = respondSseError(request, ERROR_CODES.UNAUTHORIZED, "Custom auth message");

  const text = await res.text();
  expect(text).toContain("event: error");
  expect(text).toContain("Custom auth message");
});

it("respondSseError has SSE content type even without CORS headers", async () => {
  const request = makeRequest("https://evil.example");
  const res = respondSseError(request, ERROR_CODES.UNAUTHORIZED);

  expect(res.headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8");
  expect(res.headers.get("Cache-Control")).toBeTruthy();
});

// ─── respondSseRateLimitError CORS tests ──────────────────────────

it("respondSseRateLimitError respects CORS policy for allowed same-origin requests", async () => {
  const request = makeRequest("http://localhost:3000");
  const res = respondSseRateLimitError(request, 30);

  expect(res.status).toBe(429);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
  expect(res.headers.get("Retry-After")).toBe("30");
});

it("respondSseRateLimitError omits ACAO for disallowed origins (no wildcard leak)", async () => {
  const request = makeRequest("https://evil.example");
  const res = respondSseRateLimitError(request, 30);

  expect(res.status).toBe(429);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  expect(res.headers.get("Retry-After")).toBe("30");
});

it("respondSseRateLimitError handles null request gracefully", async () => {
  const res = respondSseRateLimitError(null, 30);

  expect(res.status).toBe(429);
  expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
  expect(res.headers.get("Retry-After")).toBe("30");
});

// ─── respondError (non-SSE) should remain unchanged ───────────────

it("respondError still works without CORS changes", () => {
  const res = respondError(ERROR_CODES.VALIDATION_ERROR);

  expect(res.status).toBe(400);
  expect(res.headers.get("Content-Type")).toBe("application/json");
  expect(res.headers.get("Access-Control-Allow-Origin")).toBeNull();
});

// ─── Existing functionality unchanged ─────────────────────────────

it("createErrorResponse still works", () => {
  const err = createErrorResponse(ERROR_CODES.UNAUTHORIZED);
  expect(err.error.code).toBe("UNAUTHORIZED");
  expect(err.error.message).toBe("Unauthorized access");
});

it("createErrorResponse includes details when provided", () => {
  const err = createErrorResponse(ERROR_CODES.VALIDATION_ERROR, null, { field: "prompt" });
  expect(err.error.details).toEqual({ field: "prompt" });
});

it("ApiError class still works", () => {
  const err = new ApiError(ERROR_CODES.UNAUTHORIZED);
  expect(err).toBeInstanceOf(Error);
  expect(err.name).toBe("ApiError");
  expect(err.code).toBe("UNAUTHORIZED");
});

it("respondSseRateLimitError includes SSE content type and Retry-After", async () => {
  const request = makeRequest("http://localhost:3000");
  const res = respondSseRateLimitError(request, 15);

  expect(res.status).toBe(429);
  expect(res.headers.get("Content-Type")).toBe("text/event-stream; charset=utf-8");
  const text = await res.text();
  expect(text).toContain("event: error");
  expect(text).toContain("RATE_LIMIT_EXCEEDED");
  // Verify no wildcard ACAO
  expect(res.headers.get("Access-Control-Allow-Origin")).not.toBe("*");
});
