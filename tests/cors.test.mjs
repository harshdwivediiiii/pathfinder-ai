import { afterEach, expect, it, vi } from "vitest";

vi.mock("../lib/env.js", () => ({
  getEnv: () => ({
    ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
    CORS_ORIGIN: process.env.CORS_ORIGIN,
  }),
}));

import {
  getCorsAllowedOrigins,
  resolveCorsPolicy,
} from "../lib/cors.js";

import { vi } from "vitest";

vi.mock("../lib/env.js", () => {
  return {
    getEnv: () => ({
      ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
      CORS_ORIGIN: process.env.CORS_ORIGIN,
    }),
  };
});

afterEach(() => {
  delete process.env.ALLOWED_ORIGINS;
  delete process.env.CORS_ORIGIN;
});

it("allows same-origin requests without an explicit allowlist", () => {
  const request = {
    url: "http://localhost:3000/api/generate",
    headers: { get: (key) => key.toLowerCase() === "origin" ? "http://localhost:3000" : null }
  };

  const policy = resolveCorsPolicy(request);

  expect(policy.allowed).toBe(true);
  expect(policy.headers.get("Access-Control-Allow-Origin")).toBe("http://localhost:3000");
});

it("rejects untrusted cross-origin requests", () => {
  const request = {
    url: "http://localhost:3000/api/generate",
    headers: { get: (key) => key.toLowerCase() === "origin" ? "https://evil.example" : null }
  };

  const policy = resolveCorsPolicy(request);

  expect(policy.allowed).toBe(false);
  expect(policy.origin).toBe("https://evil.example");
});

it("allows configured cross-origin requests from ALLOWED_ORIGINS and CORS_ORIGIN", () => {
  process.env.ALLOWED_ORIGINS = "https://app.example.com, https://admin.example.com";
  process.env.CORS_ORIGIN = "https://studio.example.com";

  const origins = getCorsAllowedOrigins();
  expect(origins.has("https://app.example.com")).toBe(true);
  expect(origins.has("https://admin.example.com")).toBe(true);
  expect(origins.has("https://studio.example.com")).toBe(true);

  const request = {
    url: "http://localhost:3000/api/generate",
    headers: { get: (key) => key.toLowerCase() === "origin" ? "https://studio.example.com" : null }
  };

  const policy = resolveCorsPolicy(request);

  expect(policy.allowed).toBe(true);
  expect(policy.headers.get("Access-Control-Allow-Origin")).toBe("https://studio.example.com");
  expect(policy.headers.get("Vary")).toBe("Origin");
});