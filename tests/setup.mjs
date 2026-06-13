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