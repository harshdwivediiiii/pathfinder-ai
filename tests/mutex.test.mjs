import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BucketMutex, MutexTimeoutError, getGlobalBucketMutex } from '../lib/rate-limit/mutex.js';

describe('BucketMutex', () => {
  let mutex;

  beforeEach(() => {
    mutex = new BucketMutex();
  });

  afterEach(() => {
    // Clean up any remaining locks
    mutex.cleanup();
  });

  describe('Normal behavior', () => {
    it('should acquire and release a single lock', async () => {
      let executed = false;
      await mutex.withLock('test-key', async () => {
        executed = true;
      });
      expect(executed).toBe(true);
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should execute callbacks sequentially on the same key', async () => {
      const order = [];
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      await Promise.all([
        mutex.withLock('test-key', async () => {
          order.push(1);
          await delay(10);
          order.push(2);
        }),
        mutex.withLock('test-key', async () => {
          order.push(3);
          await delay(10);
          order.push(4);
        }),
        mutex.withLock('test-key', async () => {
          order.push(5);
          await delay(10);
          order.push(6);
        }),
      ]);

      expect(order).toEqual([1, 2, 3, 4, 5, 6]);
    });

    it('should execute concurrently on different keys', async () => {
      const order = [];
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      await Promise.all([
        mutex.withLock('key-a', async () => {
          order.push('a-start');
          await delay(50);
          order.push('a-end');
        }),
        mutex.withLock('key-b', async () => {
          order.push('b-start');
          await delay(50);
          order.push('b-end');
        }),
      ]);

      expect(order).toContain('a-start');
      expect(order).toContain('b-start');
      expect(order).toContain('a-end');
      expect(order).toContain('b-end');
    });

    it('should maintain FIFO ordering', async () => {
      const order = [];
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const promises = [];
      for (let i = 1; i <= 5; i++) {
        promises.push(
          mutex.withLock('test-key', async () => {
            order.push(i);
            await delay(10);
          })
        );
      }

      await Promise.all(promises);
      expect(order).toEqual([1, 2, 3, 4, 5]);
    });

    it('should return callback result', async () => {
      const result = await mutex.withLock('test-key', async () => {
        return 'success';
      });
      expect(result).toBe('success');
    });

    it('should propagate callback errors', async () => {
      await expect(
        mutex.withLock('test-key', async () => {
          throw new Error('Callback error');
        })
      ).rejects.toThrow('Callback error');
      expect(mutex.getLockCount()).toBe(0);
    });
  });

  describe('Timeout behavior', () => {
    it('should parse and reject a denied waiter with a timeout (regression for corrupted mutex)', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Hold the lock so the waiter is denied until its timeout fires
      const holdLock = mutex.withLock('regression-key', async () => {
        await delay(150);
      });

      const deniedWaiter = mutex.withLock(
        'regression-key',
        async () => 'should-not-run',
        { timeoutMs: 50 }
      );

      await expect(deniedWaiter).rejects.toThrow(MutexTimeoutError);
      await holdLock;
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should timeout when lock cannot be acquired', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Hold the lock indefinitely
      const holdLock = mutex.withLock('test-key', async () => {
        await new Promise(() => {}); // Never resolves
      });

      // Try to acquire with short timeout
      await expect(
        mutex.withLock('test-key', async () => {}, { timeoutMs: 100 })
      ).rejects.toThrow(MutexTimeoutError);

      // Clean up the hanging promise
      holdLock.catch(() => {});
    });

    it('should include key and timeout in error', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await new Promise(() => {});
      });

      try {
        await mutex.withLock('test-key', async () => {}, { timeoutMs: 100 });
        fail('Should have thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(MutexTimeoutError);
        expect(error.key).toBe('test-key');
        expect(error.timeoutMs).toBe(100);
        expect(error.message).toContain('test-key');
        expect(error.message).toContain('100');
      }

      holdLock.catch(() => {});
    });

    it('should remove timed-out waiter from queue', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Hold the lock
      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      // Add multiple waiters that will timeout
      const waiter1 = mutex.withLock('test-key', async () => {}, { timeoutMs: 50 });
      const waiter2 = mutex.withLock('test-key', async () => {}, { timeoutMs: 50 });
      const waiter3 = mutex.withLock('test-key', async () => {}, { timeoutMs: 50 });

      await expect(waiter1).rejects.toThrow(MutexTimeoutError);
      await expect(waiter2).rejects.toThrow(MutexTimeoutError);
      await expect(waiter3).rejects.toThrow(MutexTimeoutError);

      // After lock is released, queue should be empty
      await holdLock;
      await delay(10);
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should not corrupt queue after timeout', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const order = [];

      // Hold the lock briefly
      const holdLock = mutex.withLock('test-key', async () => {
        order.push('hold-start');
        await delay(100);
        order.push('hold-end');
      });

      // Add a waiter that will timeout
      const timeoutWaiter = mutex.withLock('test-key', async () => {
        order.push('timeout-waiter');
      }, { timeoutMs: 50 });

      // Add a waiter that should succeed after timeout
      const successWaiter = mutex.withLock('test-key', async () => {
        order.push('success-waiter');
      }, { timeoutMs: 500 });

      await expect(timeoutWaiter).rejects.toThrow(MutexTimeoutError);
      await successWaiter;
      await holdLock;

      expect(order).toEqual(['hold-start', 'hold-end', 'success-waiter']);
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should clear timer on timeout', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      const waiter = mutex.withLock('test-key', async () => {}, { timeoutMs: 50 });

      await expect(waiter).rejects.toThrow(MutexTimeoutError);
      
      // After timeout, the waiter should be removed and timer cleared
      const lock = mutex.locks.get('test-key');
      expect(lock.waiters.length).toBe(0);

      await holdLock;
    });

    it('should handle timeout during heavy contention', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const results = [];

      // Hold the lock
      const holdLock = mutex.withLock('test-key', async () => {
        await delay(150);
      });

      // Add many waiters with short timeouts
      const waiters = [];
      for (let i = 0; i < 10; i++) {
        waiters.push(
          mutex.withLock('test-key', async () => {
            results.push(i);
          }, { timeoutMs: 50 })
        );
      }

      // All should timeout
      await Promise.all(waiters.map(w => w.catch(() => {})));
      expect(results).toEqual([]);

      await holdLock;
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should not leave stale queue entries after timeout', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      // Add waiters that will timeout
      for (let i = 0; i < 5; i++) {
        await mutex.withLock('test-key', async () => {}, { timeoutMs: 50 }).catch(() => {});
      }

      await holdLock;
      await delay(10);

      // Queue should be empty
      const stats = mutex.getStats();
      expect(stats.totalWaiters).toBe(0);
      expect(mutex.getLockCount()).toBe(0);
    });
  });

  describe('Hanging callback handling', () => {
    it('should allow new requests after hanging callback times out', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Create a hanging callback
      const hangingLock = mutex.withLock('test-key', async () => {
        await new Promise(() => {}); // Never resolves
      });

      // Waiter should timeout
      await expect(
        mutex.withLock('test-key', async () => {}, { timeoutMs: 100 })
      ).rejects.toThrow(MutexTimeoutError);

      // After timeout, new request should still work once lock is available
      // Note: Since the callback never resolves, the lock is never released
      // But the timeout mechanism should still work correctly
      hangingLock.catch(() => {});

      // Create a new mutex instance for a fresh test
      const freshMutex = new BucketMutex();
      let executed = false;
      await freshMutex.withLock('new-key', async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });

    it('should maintain queue integrity with hanging callback', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const results = [];

      // First callback hangs
      const hanging = mutex.withLock('test-key', async () => {
        await new Promise(() => {});
      });

      // Second waiter times out
      const timeoutWaiter = mutex.withLock('test-key', async () => {
        results.push('timeout');
      }, { timeoutMs: 50 });

      await expect(timeoutWaiter).rejects.toThrow(MutexTimeoutError);
      expect(results).toEqual([]);

      // Queue should still be valid
      const stats = mutex.getStats();
      expect(stats.totalLocks).toBe(1);
      expect(stats.locksInUse).toBe(1);
      expect(stats.totalWaiters).toBe(0);

      hanging.catch(() => {});
    });
  });

  describe('Cleanup behavior', () => {
    it('should remove unused locks', async () => {
      await mutex.withLock('test-key', async () => {});
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should cleanup locks when threshold exceeded', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      // Set a low threshold for testing
      mutex.cleanupThreshold = 5;

      // Create multiple locks
      for (let i = 0; i < 10; i++) {
        await mutex.withLock(`key-${i}`, async () => {
          await delay(1);
        });
      }

      // Some locks should have been cleaned up
      expect(mutex.getLockCount()).toBeLessThan(10);
    });

    it('should remove timed-out waiters during cleanup', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      // Add waiters that will timeout
      const waiters = [];
      for (let i = 0; i < 5; i++) {
        waiters.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(waiters.map(w => w.catch(() => {})));
      await holdLock;

      // Trigger cleanup
      mutex.cleanup();

      const stats = mutex.getStats();
      expect(stats.totalWaiters).toBe(0);
    });

    it('should not remove locks with active waiters', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(100);
      });

      // Add a waiter
      const waiter = mutex.withLock('test-key', async () => {
        await delay(10);
      });

      // Trigger cleanup while lock has waiters
      mutex.cleanup();

      expect(mutex.getLockCount()).toBe(1);

      await holdLock;
      await waiter;
    });

    it('should use explicit state for cleanup instead of timer internals', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      // Add waiters that will timeout
      const waiters = [];
      for (let i = 0; i < 3; i++) {
        waiters.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(waiters.map(w => w.catch(() => {})));
      
      // Verify waiters are marked as expired without checking timer internals
      const lock = mutex.locks.get('test-key');
      expect(lock).toBeDefined();
      expect(lock.waiters.length).toBe(0); // Should be removed immediately on timeout

      await holdLock;
    });

    it('should cleanup be idempotent', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(100);
      });

      // Add waiters that will timeout
      const waiters = [];
      for (let i = 0; i < 3; i++) {
        waiters.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(waiters.map(w => w.catch(() => {})));
      
      // Call cleanup multiple times
      mutex.cleanup();
      mutex.cleanup();
      mutex.cleanup();

      const stats = mutex.getStats();
      expect(stats.totalWaiters).toBe(0);

      await holdLock;
    });

    it('should handle cleanup during active execution', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const executing = mutex.withLock('test-key', async () => {
        // Cleanup while lock is held
        mutex.cleanup();
        await delay(50);
      });

      await executing;
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should handle cleanup with empty queue', async () => {
      mutex.cleanup();
      expect(mutex.getLockCount()).toBe(0);
      
      mutex.cleanup();
      mutex.cleanup();
      
      expect(mutex.getLockCount()).toBe(0);
    });
  });

  describe('Concurrency guarantees', () => {
    it('should only execute one callback at a time per key', async () => {
      let concurrent = 0;
      let maxConcurrent = 0;
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(
          mutex.withLock('test-key', async () => {
            concurrent++;
            maxConcurrent = Math.max(maxConcurrent, concurrent);
            await delay(20);
            concurrent--;
          })
        );
      }

      await Promise.all(promises);
      expect(maxConcurrent).toBe(1);
    });

    it('should handle many simultaneous requests', async () => {
      const results = [];
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const promises = [];
      for (let i = 0; i < 50; i++) {
        promises.push(
          mutex.withLock('test-key', async () => {
            results.push(i);
            await delay(5);
          })
        );
      }

      await Promise.all(promises);
      expect(results.length).toBe(50);
      expect(results).toEqual([...Array(50).keys()]);
    });

    it('should prevent race conditions', async () => {
      let counter = 0;
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const promises = [];
      for (let i = 0; i < 100; i++) {
        promises.push(
          mutex.withLock('test-key', async () => {
            const current = counter;
            await delay(1);
            counter = current + 1;
          })
        );
      }

      await Promise.all(promises);
      expect(counter).toBe(100);
    });

    it('should handle different keys concurrently', async () => {
      const results = new Map();
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const promises = [];
      for (let i = 0; i < 20; i++) {
        const key = `key-${i % 5}`; // 5 different keys
        promises.push(
          mutex.withLock(key, async () => {
            if (!results.has(key)) {
              results.set(key, 0);
            }
            results.set(key, results.get(key) + 1);
            await delay(10);
          })
        );
      }

      await Promise.all(promises);
      expect(results.size).toBe(5);
      for (const count of results.values()) {
        expect(count).toBe(4); // 20 requests / 5 keys = 4 each
      }
    });
  });

  describe('Backward compatibility', () => {
    it('should work without options parameter', async () => {
      let executed = false;
      await mutex.withLock('test-key', async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });

    it('should maintain cleanup() API', async () => {
      await mutex.withLock('test-key', async () => {
        // Lock is held
      });
      mutex.cleanup();
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should maintain getLockCount() API', async () => {
      expect(mutex.getLockCount()).toBe(0);
      await mutex.withLock('test-key', async () => {
        expect(mutex.getLockCount()).toBe(1);
      });
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should maintain getGlobalBucketMutex() API', async () => {
      const globalMutex = getGlobalBucketMutex();
      expect(globalMutex).toBeInstanceOf(BucketMutex);

      let executed = false;
      await globalMutex.withLock('test-key', async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });

    it('should return same global mutex instance', () => {
      const mutex1 = getGlobalBucketMutex();
      const mutex2 = getGlobalBucketMutex();
      expect(mutex1).toBe(mutex2);
    });
  });

  describe('Error handling', () => {
    it('should release lock on callback error', async () => {
      await expect(
        mutex.withLock('test-key', async () => {
          throw new Error('Test error');
        })
      ).rejects.toThrow('Test error');

      expect(mutex.getLockCount()).toBe(0);

      // Should be able to acquire lock again
      let executed = false;
      await mutex.withLock('test-key', async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });

    it('should handle multiple errors gracefully', async () => {
      const errors = [];

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          mutex.withLock('test-key', async () => {
            throw new Error(`Error ${i}`);
          }).catch(err => errors.push(err.message))
        );
      }

      await Promise.all(promises);
      expect(errors.length).toBe(5);
      expect(mutex.getLockCount()).toBe(0);
    });
  });

  describe('Statistics and debugging', () => {
    it('should provide accurate stats', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('key-1', async () => {
        await delay(100);
      });

      // Add waiters
      const waiter1 = mutex.withLock('key-1', async () => {}, { timeoutMs: 500 });
      const waiter2 = mutex.withLock('key-1', async () => {}, { timeoutMs: 500 });

      await delay(10);

      const stats = mutex.getStats();
      expect(stats.totalLocks).toBe(1);
      expect(stats.locksInUse).toBe(1);
      expect(stats.totalWaiters).toBe(2);

      await holdLock;
      await waiter1;
      await waiter2;
    });

    it('should track locks by waiter count', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock1 = mutex.withLock('key-1', async () => {
        await delay(100);
      });

      const holdLock2 = mutex.withLock('key-2', async () => {
        await delay(100);
      });

      // Add different numbers of waiters
      const waiters1 = [
        mutex.withLock('key-1', async () => {}, { timeoutMs: 500 }),
        mutex.withLock('key-1', async () => {}, { timeoutMs: 500 }),
        mutex.withLock('key-1', async () => {}, { timeoutMs: 500 }),
      ];

      const waiters2 = [
        mutex.withLock('key-2', async () => {}, { timeoutMs: 500 }),
      ];

      await delay(10);

      const stats = mutex.getStats();
      expect(stats.locksByWaiterCount[3]).toBe(1);
      expect(stats.locksByWaiterCount[1]).toBe(1);

      await holdLock1;
      await holdLock2;
      await Promise.all([...waiters1, ...waiters2]);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty key', async () => {
      let executed = false;
      await mutex.withLock('', async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });

    it('should handle special characters in key', async () => {
      let executed = false;
      await mutex.withLock('key:with:special/chars', async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });

    it('should handle very long key', async () => {
      const longKey = 'a'.repeat(10000);
      let executed = false;
      await mutex.withLock(longKey, async () => {
        executed = true;
      });
      expect(executed).toBe(true);
    });

    it('should handle synchronous callbacks', async () => {
      let executed = false;
      await mutex.withLock('test-key', () => {
        executed = true;
        return Promise.resolve();
      });
      expect(executed).toBe(true);
    });

    it('should handle callbacks that return non-Promise values', async () => {
      const result = await mutex.withLock('test-key', () => {
        return 42;
      });
      expect(result).toBe(42);
    });

    it('should handle callback that throws', async () => {
      await expect(
        mutex.withLock('test-key', async () => {
          throw new Error('Callback error');
        })
      ).rejects.toThrow('Callback error');
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should handle callback that rejects', async () => {
      await expect(
        mutex.withLock('test-key', async () => {
          return Promise.reject(new Error('Rejected'));
        })
      ).rejects.toThrow('Rejected');
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should handle callback that resolves immediately', async () => {
      const result = await mutex.withLock('test-key', async () => {
        return 'immediate';
      });
      expect(result).toBe('immediate');
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should handle multiple timeout events', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(300);
      });

      // First batch of timeouts
      const batch1 = [];
      for (let i = 0; i < 3; i++) {
        batch1.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(batch1.map(w => w.catch(() => {})));

      // Second batch of timeouts
      const batch2 = [];
      for (let i = 0; i < 3; i++) {
        batch2.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(batch2.map(w => w.catch(() => {})));

      await holdLock;
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should handle repeated cleanup calls', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(100);
      });

      // Add waiters that will timeout
      const waiters = [];
      for (let i = 0; i < 3; i++) {
        waiters.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(waiters.map(w => w.catch(() => {})));

      // Call cleanup multiple times
      for (let i = 0; i < 10; i++) {
        mutex.cleanup();
      }

      await holdLock;
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should handle queue becoming empty during execution', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(100);
      });

      // Add waiters that will timeout
      const waiters = [];
      for (let i = 0; i < 3; i++) {
        waiters.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(waiters.map(w => w.catch(() => {})));

      // Queue should be empty
      const lock = mutex.locks.get('test-key');
      expect(lock.waiters.length).toBe(0);

      await holdLock;
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should handle lock removal correctly', async () => {
      await mutex.withLock('test-key', async () => {
        // Lock is held
      });
      
      // Lock should be removed after execution
      expect(mutex.locks.has('test-key')).toBe(false);
      expect(mutex.getLockCount()).toBe(0);
    });
  });

  describe('Runtime compatibility', () => {
    it('should not depend on timer._destroyed property', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      // Add waiters that will timeout
      const waiters = [];
      for (let i = 0; i < 3; i++) {
        waiters.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(waiters.map(w => w.catch(() => {})));

      // Verify cleanup works without checking timer internals
      mutex.cleanup();

      const lock = mutex.locks.get('test-key');
      expect(lock.waiters.length).toBe(0);

      await holdLock;
    });

    it('should not depend on timer._idleTimeout property', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      const waiter = mutex.withLock('test-key', async () => {}, { timeoutMs: 50 });

      await expect(waiter).rejects.toThrow(MutexTimeoutError);

      // Verify cleanup works without timer._idleTimeout
      mutex.cleanup();

      await holdLock;
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should not depend on timer._idleStart property', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      const waiter = mutex.withLock('test-key', async () => {}, { timeoutMs: 50 });

      await expect(waiter).rejects.toThrow(MutexTimeoutError);

      // Verify cleanup works without timer._idleStart
      mutex.cleanup();

      await holdLock;
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should work with explicit state only', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(200);
      });

      // Add waiters
      const waiters = [];
      for (let i = 0; i < 3; i++) {
        waiters.push(
          mutex.withLock('test-key', async () => {}, { timeoutMs: 50 })
        );
      }

      await Promise.all(waiters.map(w => w.catch(() => {})));

      // Verify waiters use explicit state
      const lock = mutex.locks.get('test-key');
      expect(lock.waiters.length).toBe(0);

      await holdLock;
    });
  });

  describe('Success path', () => {
    it('should remove completed waiter from queue', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const order = [];

      const holdLock = mutex.withLock('test-key', async () => {
        order.push('hold');
        await delay(50);
      });

      const waiter = mutex.withLock('test-key', async () => {
        order.push('waiter');
      });

      await holdLock;
      await waiter;

      expect(order).toEqual(['hold', 'waiter']);
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should clear timer on successful acquisition', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(50);
      });

      const waiter = mutex.withLock('test-key', async () => {
        // This should succeed
      });

      await holdLock;
      await waiter;

      // Timer should be cleared and waiter removed
      expect(mutex.getLockCount()).toBe(0);
    });

    it('should execute callback after successful acquisition', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      let executed = false;

      const holdLock = mutex.withLock('test-key', async () => {
        await delay(50);
      });

      const waiter = mutex.withLock('test-key', async () => {
        executed = true;
      });

      await holdLock;
      await waiter;

      expect(executed).toBe(true);
    });

    it('should handle multiple successful acquisitions', async () => {
      const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
      const results = [];

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          mutex.withLock('test-key', async () => {
            results.push(i);
            await delay(10);
          })
        );
      }

      await Promise.all(promises);

      expect(results).toEqual([0, 1, 2, 3, 4]);
      expect(mutex.getLockCount()).toBe(0);
    });
  });
});
