import "server-only";

/**
 * Per-bucket mutex implementation for rate limiting.
 * 
 * This provides fine-grained locking at the bucket key level, ensuring that
 * concurrent operations on the same bucket are serialized while operations on
 * different buckets can proceed in parallel.
 * 
 * The mutex uses a Map to store locks per bucket key, with automatic cleanup
 * of unused locks to prevent memory leaks.
 * 
 * ## Queue-Based Waiter System
 * 
 * This implementation uses a FIFO queue-based waiter mechanism instead of
 * timer-based polling. Each waiting request is suspended with a Promise resolver
 * and is explicitly woken by the lock holder when it releases the lock.
 * 
 * Benefits over timer-based polling:
 * - Eliminates repeated event-loop wakeups
 * - Reduces timer allocations under contention
 * - Minimizes scheduling overhead
 * - Improves scalability with many waiting requests
 * - Avoids the "thundering herd" problem by waking only one waiter
 * 
 * ## Lock Lifecycle
 * 
 * 1. **Acquisition**: If lock is free, acquire immediately. If occupied, enqueue
 *    a waiter and suspend until woken.
 * 2. **Execution**: Callback runs while holding the lock.
 * 3. **Release**: Lock is released in a finally block to ensure cleanup even on error.
 * 4. **Wake Next**: If waiters exist, the next one in FIFO order is woken and
 *    acquires the lock.
 * 5. **Cleanup**: If no waiters remain, the lock is deleted to prevent memory leaks.
 * 
 * ## Fairness Guarantees
 * 
 * The queue ensures FIFO ordering - requests waiting longer acquire the lock first.
 * This prevents starvation and provides fair access under high contention.
 */
export class BucketMutex {
  constructor() {
    this.locks = new Map();
    this.cleanupThreshold = 1000; // Clean up when locks map exceeds this size
  }

  /**
   * Acquire a lock for the given bucket key and execute the callback.
   * Ensures that only one operation can modify the bucket at a time.
   * 
   * @param {string} key - The bucket key to lock
   * @param {Function} callback - Async function to execute while holding the lock
   * @returns {Promise<any>} The result of the callback
   */
  async withLock(key, callback) {
    // Get or create lock for this key
    let lock = this.locks.get(key);
    if (!lock) {
      lock = { inUse: false, waiters: [] };
      this.locks.set(key, lock);
    }

    // Periodic cleanup of unused locks
    if (this.locks.size > this.cleanupThreshold) {
      this.cleanup();
    }

    // If lock is free, acquire it immediately
    if (!lock.inUse) {
      lock.inUse = true;
      try {
        return await callback();
      } finally {
        this.releaseLock(key, lock);
      }
    }

    // Lock is occupied - enqueue as a waiter and suspend until woken
    return new Promise((resolve, reject) => {
      // Create a promise resolver for this waiter
      let wakeResolve;
      const wakePromise = new Promise(resolve => {
        wakeResolve = resolve;
      });

      // Enqueue the waiter with its wake resolver
      lock.waiters.push({ wakeResolve, outerResolve: resolve, outerReject: reject });

      // When woken, acquire lock and execute callback
      wakePromise.then(async () => {
        try {
          lock.inUse = true;
          const result = await callback();
          this.releaseLock(key, lock);
          resolve(result);
        } catch (error) {
          this.releaseLock(key, lock);
          reject(error);
        }
      });
    });
  }

  /**
   * Release the lock and wake the next waiter in FIFO order.
   * This is called in a finally block to ensure the lock is always released.
   * 
   * @param {string} key - The bucket key
   * @param {Object} lock - The lock object
   */
  releaseLock(key, lock) {
    // Release the lock
    lock.inUse = false;

    // If there are waiters, wake the first one
    if (lock.waiters.length > 0) {
      const nextWaiter = lock.waiters.shift();
      if (nextWaiter.wakeResolve) {
        nextWaiter.wakeResolve();
      }
    } else {
      // No waiters - clean up the lock to prevent memory leaks
      this.locks.delete(key);
    }
  }

  /**
   * Clean up unused locks to prevent memory leaks.
   * Removes locks that are not currently in use and have no waiters.
   */
  cleanup() {
    for (const [key, lock] of this.locks.entries()) {
      if (!lock.inUse && lock.waiters.length === 0) {
        this.locks.delete(key);
      }
    }
  }

  /**
   * Get the current number of active locks (for monitoring/debugging).
   */
  getLockCount() {
    return this.locks.size;
  }

  /**
   * Get the current number of waiters across all locks (for monitoring/debugging).
   */
  getWaiterCount() {
    let count = 0;
    for (const lock of this.locks.values()) {
      count += lock.waiters.length;
    }
    return count;
  }
}

const STALE_CLEANUP_INTERVAL_MS = 5 * 60 * 1000;

// Global singleton instance for use across the application
let globalMutex = null;
let staleCleanupInterval = null;

function startStaleCleanup() {
  if (staleCleanupInterval) return;
  staleCleanupInterval = setInterval(() => {
    globalMutex?.cleanup();
  }, STALE_CLEANUP_INTERVAL_MS);
  if (typeof staleCleanupInterval.unref === "function") {
    staleCleanupInterval.unref();
  }
}

export function getGlobalBucketMutex() {
  if (!globalMutex) {
    globalMutex = new BucketMutex();
    startStaleCleanup();
  }
  return globalMutex;
}

process.on("exit", () => {
  if (staleCleanupInterval) {
    clearInterval(staleCleanupInterval);
    staleCleanupInterval = null;
  }
});
