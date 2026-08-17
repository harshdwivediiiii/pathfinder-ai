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

// Set required environment variables before any module evaluation
process.env.NODE_ENV = "test";
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
}
if (!process.env.GEMINI_API_KEY) {
  process.env.GEMINI_API_KEY = "test-api-key";
}

// Mock build-time boundary guards in test environment
vi.mock("server-only", () => ({}));
vi.mock("client-only", () => ({}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock next/cache globally to avoid Invariant errors in server actions
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

// Mock @sentry/nextjs to prevent import errors in test environment
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
  withScope: vi.fn((fn) => fn({ setTag: vi.fn(), setUser: vi.fn() })),
  init: vi.fn(),
}));

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());