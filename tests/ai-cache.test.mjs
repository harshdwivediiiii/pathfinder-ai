import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const cache = new Map();

  return {
    cache,
    cacheStore: {
      get: vi.fn(async (key) => cache.get(key) ?? null),
      set: vi.fn(async (key, value) => {
        cache.set(key, value);
      }),
      delete: vi.fn(async (key) => {
        cache.delete(key);
      }),
    },
    generateGeminiContent: vi.fn(),
  };
});

vi.mock("../lib/cache/store.js", () => ({
  getCacheStore: () => mocks.cacheStore,
}));

vi.mock("../lib/gemini.js", () => ({
  generateGeminiContent: mocks.generateGeminiContent,
}));

import { cachedGenerateGeminiContent } from "../lib/cache/ai-cache.js";

beforeEach(() => {
  mocks.cache.clear();
  vi.clearAllMocks();
});

it("deduplicates concurrent identical Gemini calls and reuses the cached response", async () => {
  mocks.generateGeminiContent.mockResolvedValue({
    response: {
      text: () => "cached response",
      candidates: [{ groundingMetadata: { groundingChunks: [{ web: { uri: "https://example.com" } }] } }],
    },
  });

  const [first, second] = await Promise.all([
    cachedGenerateGeminiContent("prompt", {}, { key: "demo:key", ttl: 60_000 }),
    cachedGenerateGeminiContent("prompt", {}, { key: "demo:key", ttl: 60_000 }),
  ]);

  expect(mocks.generateGeminiContent).toHaveBeenCalledTimes(1);
  expect(first.response.text()).toBe("cached response");
  expect(second.response.text()).toBe("cached response");
  expect(mocks.cacheStore.set).toHaveBeenCalledTimes(1);

  const cached = await cachedGenerateGeminiContent("prompt", {}, { key: "demo:key", ttl: 60_000 });
  expect(mocks.generateGeminiContent).toHaveBeenCalledTimes(1);
  expect(cached.response.text()).toBe("cached response");
  expect(cached.response.candidates).toEqual([
    { groundingMetadata: { groundingChunks: [{ web: { uri: "https://example.com" } }] } },
  ]);
});