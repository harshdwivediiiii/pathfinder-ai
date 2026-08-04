const pendingRequests = new Map();

// Track request timestamps for TTL-based cleanup
const pendingRequestTimestamps = new Map();

// Default TTL for pending requests (5 minutes)
const DEFAULT_PENDING_REQUEST_TTL_MS = 5 * 60 * 1000;

// Cleanup interval for stale requests (runs every minute)
const CLEANUP_INTERVAL_MS = 60 * 1000;

let cleanupIntervalId = null;

/**
 * Starts the periodic cleanup of stale pending requests.
 * This is called automatically on first registration.
 */
function startCleanupInterval() {
  if (cleanupIntervalId) return;
  
  cleanupIntervalId = setInterval(() => {
    cleanupStaleRequests();
  }, CLEANUP_INTERVAL_MS);
  
  // Don't block process exit
  if (cleanupIntervalId.unref) {
    cleanupIntervalId.unref();
  }
}

/**
 * Removes requests that have exceeded their TTL.
 * This is a defensive cleanup mechanism for edge cases where
 * Promise.finally() might not execute (e.g., process termination,
 * unhandled exceptions, or memory leaks).
 */
function cleanupStaleRequests() {
  const now = Date.now();
  let cleanedCount = 0;
  
  for (const [cacheKey, timestamp] of pendingRequestTimestamps.entries()) {
    const age = now - timestamp;
    if (age > DEFAULT_PENDING_REQUEST_TTL_MS) {
      // Force cleanup of stale request regardless of promise state
      // Promise.finally() should have already cleaned settled promises,
      // so this is a defensive fallback for edge cases
      pendingRequests.delete(cacheKey);
      pendingRequestTimestamps.delete(cacheKey);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.warn(`[pending-requests] Cleaned up ${cleanedCount} stale pending requests`);
  }
}

export function getPendingRequest(cacheKey) {
  return pendingRequests.get(cacheKey) ?? null;
}

export function setPendingRequest(cacheKey, promise) {
  // Start cleanup interval on first registration
  startCleanupInterval();
  
  // Register the promise
  pendingRequests.set(cacheKey, promise);
  
  // Track timestamp for TTL-based cleanup
  pendingRequestTimestamps.set(cacheKey, Date.now());
  
  // Automatic cleanup when promise settles (resolve or reject)
  // This is the primary cleanup mechanism
  promise.finally(() => {
    pendingRequests.delete(cacheKey);
    pendingRequestTimestamps.delete(cacheKey);
  }).catch(() => {
    // Suppress any errors from finally to avoid unhandled rejections
  });
}

export function deletePendingRequest(cacheKey) {
  pendingRequests.delete(cacheKey);
  pendingRequestTimestamps.delete(cacheKey);
}

/**
 * Atomically registers the first request for a cache key.
 *
 * This prevents multiple concurrent requests from observing
 * an empty pending state and starting duplicate AI generations.
 *
 * Subsequent requests reuse the same pending Promise until
 * generation completes.
 *
 * @param {string} cacheKey - The cache key for deduplication
 * @returns {{promise: Promise, isCreator: boolean, resolve: Function, reject: Function}} 
 *          The pending promise, whether this call created it, and resolve/reject functions
 */
export function getOrCreatePendingRequest(cacheKey) {
  // Check if a pending request already exists
  const existing = getPendingRequest(cacheKey);
  if (existing) {
    return { promise: existing, isCreator: false };
  }

  // Create a deferred promise that will be resolved with the actual generation result
  let resolvePromise, rejectPromise;
  const deferredPromise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  // Immediately register the deferred promise BEFORE any async work
  // This is the critical atomic operation that prevents the race
  setPendingRequest(cacheKey, deferredPromise);

  // Double-check: another request may have registered while we were setting up
  // If so, delete our registration and return the existing one
  const doubleCheck = getPendingRequest(cacheKey);
  if (doubleCheck !== deferredPromise) {
    deletePendingRequest(cacheKey);
    return { promise: doubleCheck, isCreator: false };
  }

  // Return the deferred promise along with resolve/reject functions
  return { 
    promise: deferredPromise, 
    isCreator: true,
    resolve: resolvePromise,
    reject: rejectPromise
  };
}
