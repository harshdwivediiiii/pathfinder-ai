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
      .catch(err => console.error(err))