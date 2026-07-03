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
      lock = { queue: [], inUse: false };
      this.locks.set(key, lock);
    }

    // Increment queue count for this lock
    lock.queue.push(true);

    // Periodic cleanup of unused locks
    if (this.locks.size > this.cleanupThreshold) {
      this.cleanup();
    }

    // Wait for our turn
    while (lock.inUse) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }

    // Acquire the lock
    lock.inUse = true;
    lock.queue.shift();

    try {
      // Execute the callback while holding the lock
      return await callback();
    } finally {
      // Always release the lock
      lock.inUse = false;
      
      // Clean up lock if no one is waiting
      if (lock.queue.length === 0) {
        this.locks.delete(key);
      }
    }
  }

  /**
   * Clean up unused locks to prevent memory leaks.
   * Removes locks that are not currently in use and have no waiters.
   */
  cleanup() {
    for (const [key, lock] of this.locks.entries()) {
      if (!lock.inUse && lock.queue.length === 0) {
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
}

// Global singleton instance for use across the application
let globalMutex = null;

export function getGlobalBucketMutex() {
  if (!globalMutex) {
    globalMutex = new BucketMutex();
  }
  return globalMutex;
}
