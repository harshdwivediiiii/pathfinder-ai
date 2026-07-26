import { afterEach, describe, expect, it } from "vitest";

import { BucketMutex, getGlobalBucketMutex } from "../lib/rate-limit/mutex.js";

describe("BucketMutex", () => {
  let mutex;

  afterEach(() => {
    mutex = null;
  });

  describe("Basic Behavior", () => {
    it("acquires lock and executes callback", async () => {
      mutex = new BucketMutex();
      let executed = false;
      
      await mutex.withLock("test-key", async () => {
        executed = true;
      });
      
      expect(executed).toBe(true);
    });

    it("returns callback result", async () => {
      mutex = new BucketMutex();
      
      const result = await mutex.withLock("test-key", async () => {
        return 42;
      });
      
      expect(result).toBe(42);
    });

    it("executes callbacks sequentially for same key", async () => {
      mutex = new BucketMutex();
      const order = [];
      
      const promises = [
        mutex.withLock("test-key", async () => {
          order.push(1);
          await new Promise(resolve => setTimeout(resolve, 10));
          order.push(2);
        }),
        mutex.withLock("test-key", async () => {
          order.push(3);
          await new Promise(resolve => setTimeout(resolve, 10));
          order.push(4);
        }),
        mutex.withLock("test-key", async () => {
          order.push(5);
          await new Promise(resolve => setTimeout(resolve, 10));
          order.push(6);
        }),
      ];
      
      await Promise.all(promises);
      
      expect(order).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it("executes callbacks concurrently for different keys", async () => {
      mutex = new BucketMutex();
      const order = [];
      
      const promises = [
        mutex.withLock("key-1", async () => {
          order.push("a1");
          await new Promise(resolve => setTimeout(resolve, 20));
          order.push("a2");
        }),
        mutex.withLock("key-2", async () => {
          order.push("b1");
          await new Promise(resolve => setTimeout(resolve, 10));
          order.push("b2");
        }),
        mutex.withLock("key-3", async () => {
          order.push("c1");
          await new Promise(resolve => setTimeout(resolve, 5));
          order.push("c2");
        }),
      ];
      
      await Promise.all(promises);
      
      // Different keys should interleave
      expect(order).toContain("a1");
      expect(order).toContain("b1");
      expect(order).toContain("c1");
      expect(order).toContain("a2");
      expect(order).toContain("b2");
      expect(order).toContain("c2");
    });
  });

  describe("Concurrency", () => {
    it("handles multiple concurrent waiters", async () => {
      mutex = new BucketMutex();
      const results = [];
      
      const promises = Array.from({ length: 10 }, (_, i) =>
        mutex.withLock("test-key", async () => {
          results.push(i);
          await new Promise(resolve => setTimeout(resolve, 5));
        })
      );
      
      await Promise.all(promises);
      
      // All should execute in order
      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    });

    it("maintains FIFO ordering under contention", async () => {
      mutex = new BucketMutex();
      const executionOrder = [];
      
      // Start a long-running operation
      const firstOp = mutex.withLock("test-key", async () => {
        executionOrder.push("first-start");
        await new Promise(resolve => setTimeout(resolve, 50));
        executionOrder.push("first-end");
      });
      
      // Queue multiple waiters
      const waiters = Array.from({ length: 5 }, (_, i) =>
        mutex.withLock("test-key", async () => {
          executionOrder.push(`waiter-${i}`);
        })
      );
      
      await Promise.all([firstOp, ...waiters]);
      
      expect(executionOrder[0]).toBe("first-start");
      expect(executionOrder[1]).toBe("first-end");
      expect(executionOrder[2]).toBe("waiter-0");
      expect(executionOrder[3]).toBe("waiter-1");
      expect(executionOrder[4]).toBe("waiter-2");
      expect(executionOrder[5]).toBe("waiter-3");
      expect(executionOrder[6]).toBe("waiter-4");
    });

    it("isolates operations on different bucket keys", async () => {
      mutex = new BucketMutex();
      const key1Results = [];
      const key2Results = [];
      
      const promises = [
        mutex.withLock("key-1", async () => {
          key1Results.push(1);
          await new Promise(resolve => setTimeout(resolve, 20));
          key1Results.push(2);
        }),
        mutex.withLock("key-2", async () => {
          key2Results.push("a");
          await new Promise(resolve => setTimeout(resolve, 10));
          key2Results.push("b");
        }),
        mutex.withLock("key-1", async () => {
          key1Results.push(3);
        }),
        mutex.withLock("key-2", async () => {
          key2Results.push("c");
        }),
      ];
      
      await Promise.all(promises);
      
      expect(key1Results).toEqual([1, 2, 3]);
      expect(key2Results).toEqual(["a", "b", "c"]);
    });

    it("handles simultaneous lock requests", async () => {
      mutex = new BucketMutex();
      const results = [];
      
      // Fire all requests simultaneously
      const promises = Array.from({ length: 20 }, (_, i) =>
        mutex.withLock("test-key", async () => {
          results.push(i);
          await new Promise(resolve => setTimeout(resolve, 1));
        })
      );
      
      await Promise.all(promises);
      
      // All should execute exactly once in order
      expect(results.length).toBe(20);
      expect(results).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
    });
  });

  describe("Error Handling", () => {
    it("releases lock when callback throws", async () => {
      mutex = new BucketMutex();
      let secondExecuted = false;
      
      const first = mutex.withLock("test-key", async () => {
        throw new Error("Test error");
      });
      
      await expect(first).rejects.toThrow("Test error");
      
      // Lock should be released, second operation should succeed
      await mutex.withLock("test-key", async () => {
        secondExecuted = true;
      });
      
      expect(secondExecuted).toBe(true);
    });

    it("releases lock when callback rejects", async () => {
      mutex = new BucketMutex();
      let secondExecuted = false;
      
      const first = mutex.withLock("test-key", async () => {
        return Promise.reject(new Error("Rejected"));
      });
      
      await expect(first).rejects.toThrow("Rejected");
      
      // Lock should be released
      await mutex.withLock("test-key", async () => {
        secondExecuted = true;
      });
      
      expect(secondExecuted).toBe(true);
    });

    it("continues queue after error", async () => {
      mutex = new BucketMutex();
      const results = [];
      
      const promises = [
        mutex.withLock("test-key", async () => {
          results.push(1);
        }),
        mutex.withLock("test-key", async () => {
          results.push(2);
          throw new Error("Error");
        }),
        mutex.withLock("test-key", async () => {
          results.push(3);
        }),
      ];
      
      await Promise.allSettled(promises);
      
      expect(results).toEqual([1, 2, 3]);
    });

    it("handles errors in queued waiters", async () => {
      mutex = new BucketMutex();
      const results = [];
      
      const promises = [
        mutex.withLock("test-key", async () => {
          results.push(1);
        }),
        mutex.withLock("test-key", async () => {
          results.push(2);
          throw new Error("Error 2");
        }),
        mutex.withLock("test-key", async () => {
          results.push(3);
          throw new Error("Error 3");
        }),
        mutex.withLock("test-key", async () => {
          results.push(4);
        }),
      ];
      
      await Promise.allSettled(promises);
      
      expect(results).toEqual([1, 2, 3, 4]);
    });
  });

  describe("Cleanup", () => {
    it("removes lock after completion with no waiters", async () => {
      mutex = new BucketMutex();
      
      await mutex.withLock("test-key", async () => {
        // Lock should exist during execution
        expect(mutex.getLockCount()).toBe(1);
      });
      
      // Lock should be cleaned up
      expect(mutex.getLockCount()).toBe(0);
    });

    it("retains lock while waiters exist", async () => {
      mutex = new BucketMutex();
      
      const first = mutex.withLock("test-key", async () => {
        await new Promise(resolve => setTimeout(resolve, 20));
      });
      
      // Queue a waiter
      const second = mutex.withLock("test-key", async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });
      
      // Lock should exist while first is running
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(mutex.getLockCount()).toBe(1);
      
      await Promise.all([first, second]);
      
      // Lock should be cleaned up after both complete
      expect(mutex.getLockCount()).toBe(0);
    });

    it("cleanup does not remove active locks", async () => {
      mutex = new BucketMutex();
      
      const activeOp = mutex.withLock("test-key", async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Trigger cleanup
      mutex.cleanup();
      
      // Active lock should still exist
      expect(mutex.getLockCount()).toBe(1);
      
      await activeOp;
    });

    it("cleanup removes unused locks", async () => {
      mutex = new BucketMutex();
      
      // Create multiple locks
      await mutex.withLock("key-1", async () => {});
      await mutex.withLock("key-2", async () => {});
      await mutex.withLock("key-3", async () => {});
      
      expect(mutex.getLockCount()).toBe(0);
      
      // Manually add a lock without waiters
      mutex.locks.set("manual", { inUse: false, waiters: [] });
      expect(mutex.getLockCount()).toBe(1);
      
      mutex.cleanup();
      expect(mutex.getLockCount()).toBe(0);
    });

    it("cleanup respects inUse flag", async () => {
      mutex = new BucketMutex();
      
      // Add a lock that's in use
      mutex.locks.set("active", { inUse: true, waiters: [] });
      
      mutex.cleanup();
      
      // Should not remove in-use lock
      expect(mutex.getLockCount()).toBe(1);
    });

    it("cleanup respects waiters", async () => {
      mutex = new BucketMutex();
      
      // Add a lock with waiters
      mutex.locks.set("waiting", { inUse: false, waiters: [{ wakeResolve: () => {} }] });
      
      mutex.cleanup();
      
      // Should not remove lock with waiters
      expect(mutex.getLockCount()).toBe(1);
    });
  });

  describe("Stress Testing", () => {
    it("handles many concurrent requests without deadlock", async () => {
      mutex = new BucketMutex();
      const COUNT = 100;
      const results = [];
      
      const promises = Array.from({ length: COUNT }, (_, i) =>
        mutex.withLock("test-key", async () => {
          results.push(i);
          await new Promise(resolve => setTimeout(resolve, 1));
        })
      );
      
      await Promise.all(promises);
      
      expect(results.length).toBe(COUNT);
      expect(results).toEqual(Array.from({ length: COUNT }, (_, i) => i));
    });

    it("handles repeated acquisitions and releases", async () => {
      mutex = new BucketMutex();
      const ITERATIONS = 50;
      
      for (let i = 0; i < ITERATIONS; i++) {
        await mutex.withLock("test-key", async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
        });
      }
      
      expect(mutex.getLockCount()).toBe(0);
    });

    it("all callbacks execute exactly once", async () => {
      mutex = new BucketMutex();
      const executionCounts = new Map();
      
      const promises = Array.from({ length: 50 }, (_, i) =>
        mutex.withLock("test-key", async () => {
          executionCounts.set(i, (executionCounts.get(i) || 0) + 1);
          await new Promise(resolve => setTimeout(resolve, 1));
        })
      );
      
      await Promise.all(promises);
      
      // Each callback should execute exactly once
      for (const [key, count] of executionCounts.entries()) {
        expect(count).toBe(1);
      }
    });

    it("scales efficiently with many waiting requests", async () => {
      mutex = new BucketMutex();
      const COUNT = 200;
      const startTime = Date.now();
      
      const promises = Array.from({ length: COUNT }, (_, i) =>
        mutex.withLock("test-key", async () => {
          await new Promise(resolve => setTimeout(resolve, 0));
        })
      );
      
      await Promise.all(promises);
      
      const duration = Date.now() - startTime;
      
      // Should complete quickly (no busy-waiting)
      expect(duration).toBeLessThan(5000);
    });
  });

  describe("Monitoring", () => {
    it("getLockCount returns correct count", async () => {
      mutex = new BucketMutex();
      
      expect(mutex.getLockCount()).toBe(0);
      
      const op1 = mutex.withLock("key-1", async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(mutex.getLockCount()).toBe(1);
      
      const op2 = mutex.withLock("key-2", async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(mutex.getLockCount()).toBe(2);
      
      await Promise.all([op1, op2]);
      expect(mutex.getLockCount()).toBe(0);
    });

    it("getWaiterCount returns correct count", async () => {
      mutex = new BucketMutex();
      
      expect(mutex.getWaiterCount()).toBe(0);
      
      const op1 = mutex.withLock("test-key", async () => {
        await new Promise(resolve => setTimeout(resolve, 50));
      });
      
      await new Promise(resolve => setTimeout(resolve, 5));
      
      // Queue waiters
      const waiters = Array.from({ length: 5 }, () =>
        mutex.withLock("test-key", async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        })
      );
      
      await new Promise(resolve => setTimeout(resolve, 5));
      expect(mutex.getWaiterCount()).toBe(5);
      
      await Promise.all([op1, ...waiters]);
      expect(mutex.getWaiterCount()).toBe(0);
    });
  });

  describe("Global Singleton", () => {
    it("getGlobalBucketMutex returns singleton instance", () => {
      const instance1 = getGlobalBucketMutex();
      const instance2 = getGlobalBucketMutex();
      
      expect(instance1).toBe(instance2);
    });

    it("global singleton works correctly", async () => {
      const mutex = getGlobalBucketMutex();
      const results = [];
      
      await mutex.withLock("global-test", async () => {
        results.push(1);
      });
      
      expect(results).toEqual([1]);
    });
  });

  describe("Edge Cases", () => {
    it("handles empty key", async () => {
      mutex = new BucketMutex();
      
      await mutex.withLock("", async () => {
        // Should work
      });
    });

    it("handles special characters in key", async () => {
      mutex = new BucketMutex();
      
      await mutex.withLock("key:with:special/chars", async () => {
        // Should work
      });
    });

    it("handles very long key", async () => {
      mutex = new BucketMutex();
      const longKey = "a".repeat(10000);
      
      await mutex.withLock(longKey, async () => {
        // Should work
      });
    });

    it("handles callback that returns undefined", async () => {
      mutex = new BucketMutex();
      
      const result = await mutex.withLock("test-key", async () => {
        // Explicitly return undefined
      });
      
      expect(result).toBeUndefined();
    });

    it("handles callback that returns null", async () => {
      mutex = new BucketMutex();
      
      const result = await mutex.withLock("test-key", async () => {
        return null;
      });
      
      expect(result).toBeNull();
    });

    it("handles callback that returns complex object", async () => {
      mutex = new BucketMutex();
      
      const result = await mutex.withLock("test-key", async () => {
        return { foo: "bar", nested: { value: 42 } };
      });
      
      expect(result).toEqual({ foo: "bar", nested: { value: 42 } });
    });
  });
});
