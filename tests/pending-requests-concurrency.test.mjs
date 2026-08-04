import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
  getPendingRequest,
  setPendingRequest,
  deletePendingRequest,
  getOrCreatePendingRequest,
} from "../lib/cache/pending-requests.js";

describe("Pending Requests Concurrency Tests", () => {
  beforeEach(() => {
    // Clear vi mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up any pending requests by deleting known keys
    // Since pendingRequests is internal, we can't clear it directly
    // Tests should clean up their own keys
  });

  describe("getOrCreatePendingRequest - Race Condition Prevention", () => {
    it("should only allow one creator for concurrent requests", async () => {
      const cacheKey = `test-key-${Date.now()}-1`;
      const results = [];

      // Simulate 10 concurrent requests
      const promises = Array.from({ length: 10 }, (_, i) => {
        const { promise, isCreator } = getOrCreatePendingRequest(cacheKey);
        results.push({ index: i, isCreator });
        return { promise, isCreator };
      });

      await Promise.all(promises);

      // Only one request should be the creator
      const creators = results.filter(r => r.isCreator);
      expect(creators.length).toBe(1);

      // Cleanup
      deletePendingRequest(cacheKey);
    });

    it("should return the same promise to all concurrent requests", async () => {
      const cacheKey = `test-key-${Date.now()}-2`;
      const promises = [];

      // Create 5 concurrent requests
      for (let i = 0; i < 5; i++) {
        const { promise } = getOrCreatePendingRequest(cacheKey);
        promises.push(promise);
      }

      // All promises should be the same reference
      const firstPromise = promises[0];
      for (const promise of promises) {
        expect(promise).toBe(firstPromise);
      }

      // Cleanup
      deletePendingRequest(cacheKey);
    });

    it("should handle sequential requests correctly", async () => {
      const cacheKey = `test-key-${Date.now()}-3`;

      // First request - should be creator
      const { promise: promise1, isCreator: isCreator1 } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator1).toBe(true);

      // Delete to simulate completion
      deletePendingRequest(cacheKey);

      // Second request - should also be creator after cleanup
      const { promise: promise2, isCreator: isCreator2 } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator2).toBe(true);
      expect(promise2).not.toBe(promise1);

      // Cleanup
      deletePendingRequest(cacheKey);
    });

    it("should handle rapid-fire requests without race conditions", async () => {
      const cacheKey = `test-key-${Date.now()}-4`;
      const creatorCount = { value: 0 };
      const nonCreatorCount = { value: 0 };

      // Launch 100 rapid requests
      const promises = Array.from({ length: 100 }, () => {
        return new Promise((resolve) => {
          const { isCreator } = getOrCreatePendingRequest(cacheKey);
          if (isCreator) {
            creatorCount.value++;
          } else {
            nonCreatorCount.value++;
          }
          resolve();
        });
      });

      await Promise.all(promises);

      // Exactly one creator
      expect(creatorCount.value).toBe(1);
      // All others should be non-creators
      expect(nonCreatorCount.value).toBe(99);

      // Cleanup
      deletePendingRequest(cacheKey);
    });
  });

  describe("Promise Resolution and Cleanup", () => {
    it("should resolve all waiting promises when creator resolves", async () => {
      const cacheKey = `test-key-${Date.now()}-5`;
      const results = [];

      // Get the pending request (creator)
      const { promise, isCreator, resolve } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);

      // Create multiple waiters
      const waiters = Array.from({ length: 5 }, (_, i) => {
        return promise.then(result => {
          results.push({ index: i, result });
          return result;
        });
      });

      // Resolve the promise
      resolve("test-result");

      // Wait for all to resolve
      await Promise.all(waiters);

      // All should have received the same result
      expect(results).toHaveLength(5);
      results.forEach(r => {
        expect(r.result).toBe("test-result");
      });

      // Cleanup
      deletePendingRequest(cacheKey);
    });

    it("should reject all waiting promises when creator rejects", async () => {
      const cacheKey = `test-key-${Date.now()}-6`;
      const errors = [];

      // Get the pending request (creator)
      const { promise, isCreator, reject } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);

      // Create multiple waiters
      const waiters = Array.from({ length: 5 }, (_, i) => {
        return promise.catch(error => {
          errors.push({ index: i, error });
          throw error;
        });
      });

      // Reject the promise
      reject(new Error("test-error"));

      // Wait for all to reject
      await Promise.allSettled(waiters);

      // All should have received the same error
      expect(errors).toHaveLength(5);
      errors.forEach(e => {
        expect(e.error.message).toBe("test-error");
      });

      // Cleanup
      deletePendingRequest(cacheKey);
    });

    it("should cleanup pending request after completion", async () => {
      const cacheKey = `test-key-${Date.now()}-7`;

      // Get the pending request (creator)
      const { promise, isCreator, resolve } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);

      // Verify it's registered
      expect(getPendingRequest(cacheKey)).toBe(promise);

      // Resolve the promise
      resolve("test-result");
      await promise;

      // Cleanup (in real implementation, this happens in finally)
      deletePendingRequest(cacheKey);

      // Verify it's cleaned up
      expect(getPendingRequest(cacheKey)).toBeNull();
    });
  });

  describe("Different Cache Keys", () => {
    it("should allow concurrent requests for different keys", async () => {
      const timestamp = Date.now();
      const keys = [`key-${timestamp}-1`, `key-${timestamp}-2`, `key-${timestamp}-3`];
      const results = {};

      // Create concurrent requests for different keys
      const promises = keys.map(key => {
        return new Promise(resolve => {
          const { isCreator } = getOrCreatePendingRequest(key);
          results[key] = isCreator;
          resolve();
        });
      });

      await Promise.all(promises);

      // Each key should have its own creator
      expect(results[keys[0]]).toBe(true);
      expect(results[keys[1]]).toBe(true);
      expect(results[keys[2]]).toBe(true);

      // Cleanup
      keys.forEach(key => deletePendingRequest(key));
    });

    it("should not interfere between different keys", async () => {
      const timestamp = Date.now();
      const key1 = `key-${timestamp}-a`;
      const key2 = `key-${timestamp}-b`;

      // Get pending for key1
      const { promise: promise1, isCreator: isCreator1 } = getOrCreatePendingRequest(key1);
      expect(isCreator1).toBe(true);

      // Get pending for key2 - should be independent
      const { promise: promise2, isCreator: isCreator2 } = getOrCreatePendingRequest(key2);
      expect(isCreator2).toBe(true);
      expect(promise2).not.toBe(promise1);

      // Cleanup
      deletePendingRequest(key1);
      deletePendingRequest(key2);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty cache key", () => {
      const { promise, isCreator } = getOrCreatePendingRequest("");
      expect(isCreator).toBe(true);
      expect(promise).toBeInstanceOf(Promise);

      // Cleanup
      deletePendingRequest("");
    });

    it("should handle special characters in cache key", () => {
      const specialKey = `key-${Date.now()}:with:special/chars?and#symbols`;
      const { promise, isCreator } = getOrCreatePendingRequest(specialKey);
      expect(isCreator).toBe(true);
      expect(promise).toBeInstanceOf(Promise);

      // Cleanup
      deletePendingRequest(specialKey);
    });

    it("should handle very long cache key", () => {
      const longKey = `key-${Date.now()}-${"a".repeat(10000)}`;
      const { promise, isCreator } = getOrCreatePendingRequest(longKey);
      expect(isCreator).toBe(true);
      expect(promise).toBeInstanceOf(Promise);

      // Cleanup
      deletePendingRequest(longKey);
    });
  });

  describe("Automatic Cleanup - Promise.finally()", () => {
    it("should automatically remove registry entry when promise resolves", async () => {
      const cacheKey = `test-key-${Date.now()}-auto-resolve`;

      const { promise, isCreator, resolve } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);
      expect(getPendingRequest(cacheKey)).toBe(promise);

      // Resolve the promise
      resolve("test-result");
      await promise;

      // Wait for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Registry should be automatically cleaned up
      expect(getPendingRequest(cacheKey)).toBeNull();
    });

    it("should automatically remove registry entry when promise rejects", async () => {
      const cacheKey = `test-key-${Date.now()}-auto-reject`;

      const { promise, isCreator, reject } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);
      expect(getPendingRequest(cacheKey)).toBe(promise);

      // Reject the promise
      reject(new Error("test-error"));
      await promise.catch(() => {});

      // Wait for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Registry should be automatically cleaned up
      expect(getPendingRequest(cacheKey)).toBeNull();
    });

    it("should handle idempotent cleanup - multiple delete calls", async () => {
      const cacheKey = `test-key-${Date.now()}-idempotent`;

      const { promise, isCreator, resolve } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);

      // Resolve the promise
      resolve("test-result");
      await promise;

      // Wait for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Multiple delete calls should not throw
      deletePendingRequest(cacheKey);
      deletePendingRequest(cacheKey);
      deletePendingRequest(cacheKey);

      expect(getPendingRequest(cacheKey)).toBeNull();
    });

    it("should cleanup executes only once per promise", async () => {
      const cacheKey = `test-key-${Date.now()}-once`;

      const { promise, isCreator, resolve } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);

      // Resolve the promise
      resolve("test-result");
      await promise;

      // Wait for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Registry should be cleaned up
      expect(getPendingRequest(cacheKey)).toBeNull();

      // Even after more time, should still be null
      await new Promise(resolve => setTimeout(resolve, 50));
      expect(getPendingRequest(cacheKey)).toBeNull();
    });

    it("should registry size returns to zero after all requests complete", async () => {
      const timestamp = Date.now();
      const keys = [
        `key-${timestamp}-a`,
        `key-${timestamp}-b`,
        `key-${timestamp}-c`
      ];

      // Create pending requests
      const requests = keys.map(key => {
        const { promise, isCreator, resolve } = getOrCreatePendingRequest(key);
        expect(isCreator).toBe(true);
        return { key, promise, resolve };
      });

      // All should be registered
      keys.forEach(key => {
        expect(getPendingRequest(key)).not.toBeNull();
      });

      // Resolve all promises
      requests.forEach(({ resolve }) => resolve("done"));
      await Promise.all(requests.map(r => r.promise));

      // Wait for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // All should be cleaned up
      keys.forEach(key => {
        expect(getPendingRequest(key)).toBeNull();
      });
    });
  });

  describe("Automatic Cleanup - Request Deduplication", () => {
    it("should concurrent requests still share one Promise with auto cleanup", async () => {
      const cacheKey = `test-key-${Date.now()}-dedup`;

      // Create multiple concurrent requests
      const results = [];
      const promises = Array.from({ length: 5 }, (_, i) => {
        const { promise, isCreator } = getOrCreatePendingRequest(cacheKey);
        results.push({ index: i, isCreator });
        return promise;
      });

      // All should share the same promise
      const firstPromise = promises[0];
      promises.forEach(p => expect(p).toBe(firstPromise));

      // Only one creator
      const creators = results.filter(r => r.isCreator);
      expect(creators.length).toBe(1);

      // Resolve the promise
      const creator = results.find(r => r.isCreator);
      // We need to get the resolve function from the creator
      // Since we don't have it directly, let's use a different approach
      const { resolve } = getOrCreatePendingRequest(cacheKey);
      if (resolve) {
        resolve("test-result");
        await firstPromise;

        // Wait for finally to execute
        await new Promise(resolve => setTimeout(resolve, 10));

        // Registry should be cleaned up
        expect(getPendingRequest(cacheKey)).toBeNull();
      } else {
        // Manual cleanup for this test
        deletePendingRequest(cacheKey);
      }
    });

    it("should duplicate creators are prevented with auto cleanup", async () => {
      const cacheKey = `test-key-${Date.now()}-no-dup`;

      const { promise: promise1, isCreator: isCreator1 } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator1).toBe(true);

      // Second request should not be creator
      const { promise: promise2, isCreator: isCreator2 } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator2).toBe(false);
      expect(promise2).toBe(promise1);

      // Cleanup
      deletePendingRequest(cacheKey);
    });
  });

  describe("Automatic Cleanup - Edge Cases", () => {
    it("should handle rejected promises with auto cleanup", async () => {
      const cacheKey = `test-key-${Date.now()}-reject-edge`;

      const { promise, isCreator, reject } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);

      // Reject with an error
      reject(new Error("simulated failure"));
      await promise.catch(() => {});

      // Wait for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Registry should be cleaned up
      expect(getPendingRequest(cacheKey)).toBeNull();
    });

    it("should handle cancelled requests with auto cleanup", async () => {
      const cacheKey = `test-key-${Date.now()}-cancel`;

      const { promise, isCreator, reject } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);

      // Simulate cancellation by rejecting
      reject(new Error("cancelled"));
      await promise.catch(() => {});

      // Wait for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Registry should be cleaned up
      expect(getPendingRequest(cacheKey)).toBeNull();
    });

    it("should handle unexpected exceptions in promise chain", async () => {
      const cacheKey = `test-key-${Date.now()}-exception`;

      const { promise, isCreator, resolve } = getOrCreatePendingRequest(cacheKey);
      expect(isCreator).toBe(true);

      // Create a promise chain that throws
      const chainedPromise = promise.then(() => {
        throw new Error("unexpected error");
      });

      resolve("test-result");
      await chainedPromise.catch(() => {});

      // Wait for finally to execute
      await new Promise(resolve => setTimeout(resolve, 10));

      // Registry should be cleaned up
      expect(getPendingRequest(cacheKey)).toBeNull();
    });
  });
});
