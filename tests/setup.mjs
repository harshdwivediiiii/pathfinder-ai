import { afterAll, afterEach, beforeAll, vi } from "vitest";

import { server } from "./mocks/server.mjs";

// Ensure AbortController and AbortSignal are consistent with Node.js native implementations
// to avoid prototype mismatch with undici's fetch in some test environments (like jsdom).
if (typeof globalThis.AbortController !== "undefined" && 
    globalThis.AbortController.name !== "AbortController" && 
    process.env.NODE_ENV === "test") {
  // Future-proofing: if the environment overrides AbortController in a way that breaks fetch,
  // this is where we would normalize it. For happy-dom, it is already compatible.
}

// Set required environment variables for tests
// Set required environment variables before any module evaluation
process.env.NODE_ENV = "test";
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = "test-api-key";
}

import { vi, afterAll, afterEach, beforeAll } from "vitest";

// Mock build-time boundary guards in test environment
vi.mock("server-only", () => ({}));
vi.mock("client-only", () => ({}));

import { server } from "./mocks/server.mjs";

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());