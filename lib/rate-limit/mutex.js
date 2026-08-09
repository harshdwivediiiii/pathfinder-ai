import "server-only";

/**
 * Error thrown when a lock acquisition times out.
 */
export class MutexTimeoutError extends Error {
  constructor(key, timeoutMs) {
    super(`Failed to acquire mutex for bucket "${key}" within ${timeoutMs}ms.`);
    this.name = 'MutexTimeoutError';
    this.key = key;
    this.timeoutMs = timeoutMs;
  }
}

/**
 * Default timeout for lock acquisition in milliseconds.
 */
const DEFAULT_LOCK_TIMEOUT_MS = 30000;

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
 * The implementation uses a Promise-based waiter queue instead of busy waiting,
 * and supports configurable timeouts for lock acquisition.
 */
export class BucketMutex {
  constructor() {
    this.locks = new Map();
    this.cleanupThreshold = 1000; // Clean up when locks map exceeds this size
    this.lockTimeoutMs = DEFAULT_LOCK_TIMEOUT_MS;
  }

  /**
   * Acquire a lock for the given bucket key and execute the callback.
   * Ensures that only one operation can modify the bucket at a time.
   * 
   * @param {string} key - The bucket key to lock
   * @param {Function} callback - Async function to execute while holding the lock
   * @param {Object} options - Optional configuration
   * @param {number} options.timeoutMs - Lock acquisition timeout in milliseconds
   * @returns {Promise<any>} The result of the callback
   * @throws {MutexTimeoutError} If lock cannot be acquired within timeout
   */
  async withLock(key, callback, options = {}) {
    const timeoutMs = options.timeoutMs ?? this.lockTimeoutMs;

    // Get or create lock for this key
    let lock = this.locks.get(key);
    if (!lock) {
      lock = { 
        inUse: false, 
        waiters: [] // Array of { resolve, reject, timer, expired, completed }
      };
      this.locks.set(key, lock);
    }

    // Periodic cleanup of unused locks
    if (this.locks.size > this.cleanupThreshold) {
      this.cleanup();
    }

    // If lock is not in use, acquire it immediately
    if (!lock.inUse) {
      lock.inUse = true;
      try {
        return await callback();
      } finally {
        this.releaseLock(key, lock);
      }
    }

    // Otherwise, wait in the queue
    return new Promise((outerResolve, outerReject) => {
      // Create waiter entry with explicit state tracking
      const waiter = {
        resolve: null,
        reject: null,
        timer: null,
        expired: false,
        completed: false
      };

      // Create timeout
      const timer = setTimeout(() => {
        timedOut = true;
        waiter.timedOut = true;
      waiter.timer = setTimeout(() => {
        // Mark as expired and remove from queue
        waiter.expired = true;
        clearTimeout(waiter.timer);
        
        // Remove this waiter from the queue
        const index = lock.waiters.findIndex(w => w === waiter);
        if (index !== -1) {
          lock.waiters.splice(index, 1);
        }
        outerReject(new MutexTimeoutError(key, timeoutMs));
      }, timeoutMs);

      // Create waiter entry
      const waiter = {
        resolve: () => {
          if (!timedOut) {
            clearTimeout(timer);
            // Acquire the lock and execute the callback
            lock.inUse = true;
            Promise.resolve(callback())
              .then((result) => {
                outerResolve(result);
              })
              .catch((error) => {
                outerReject(error);
              })
              .finally(() => {
                this.releaseLock(key, lock);
              });
          }
        },
        timer
      // Store resolve/reject functions
      waiter.resolve = async () => {
        if (!waiter.expired && !waiter.completed) {
          waiter.completed = true;
          clearTimeout(waiter.timer);
          
          // Acquire the lock and execute the callback
          lock.inUse = true;
          try {
            const result = await callback();
            outerResolve(result);
          } catch (error) {
            outerReject(error);
          } finally {
            this.releaseLock(key, lock);
          }
        }
      };

      lock.waiters.push(waiter);
    });
  }

  /**
   * Release the lock and wake the next waiter in the queue.
   * 
   * @param {string} key - The bucket key
   * @param {Object} lock - The lock object
   */
  releaseLock(key, lock) {
    lock.inUse = false;

    // Wake the next waiter if any
    while (lock.waiters.length > 0) {
      const nextWaiter = lock.waiters.shift();
      
      // Skip expired waiters
      if (nextWaiter.expired) {
        continue;
      }
      
      // Execute the next waiter's callback
      lock.inUse = true;
      nextWaiter.resolve();
      break;
    }

    // Clean up lock if no one is waiting
    if (lock.waiters.length === 0 && !lock.inUse) {
      this.locks.delete(key);
    }
  }

  /**
   * Clean up unused locks to prevent memory leaks.
   * Removes locks that are not currently in use and have no waiters.
   * Also cleans up any expired waiters using explicit state tracking.
   */
  cleanup() {
    for (const [key, lock] of this.locks.entries()) {
      // Remove waiters with cleared timers (timed out)
      lock.waiters = lock.waiters.filter(waiter => {
        if (waiter.timedOut) {
          return false;
        }
        return true;
      });
      // Remove expired waiters using explicit state
      lock.waiters = lock.waiters.filter(waiter => !waiter.expired);

      // Delete lock if not in use and no active waiters
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
   * Get detailed statistics about the mutex state (for debugging).
   */
  getStats() {
    const stats = {
      totalLocks: this.locks.size,
      locksInUse: 0,
      totalWaiters: 0,
      locksByWaiterCount: {}
    };

    for (const [key, lock] of this.locks.entries()) {
      if (lock.inUse) {
        stats.locksInUse++;
      }
      const waiterCount = lock.waiters.length;
      stats.totalWaiters += waiterCount;
      stats.locksByWaiterCount[waiterCount] = (stats.locksByWaiterCount[waiterCount] || 0) + 1;
    }

    return stats;
  }
}

// Global singleton instance for use across the application
let globalMutex = null;

export function getGlobalBucketMutex() {
  if (!globalMutex) {
    globalMutex = new BucketMutex();
  }
  return globalMutex;
}
