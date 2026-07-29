import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./mocks/server.mjs";

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

beforeAll(() => server.listen({ onUnhandledRequest: "warn" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
// Globally mock rate limiting — use bare vi.fn() so individual tests can override
// with mockResolvedValue/mockReturnValue in their own vi.mock or beforeEach.
// Never hardcode allowed:true here — it prevents tests from exercising
// the rate-limit-exceeded code path.
vi.mock("@/lib/security/rate-limit-actions", () => ({
  checkRateLimit: vi.fn(),
  formatResetTime: vi.fn(),
}));
