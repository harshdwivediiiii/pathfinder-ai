const MAX_PENDING_REQUESTS = 10000;
const PENDING_TTL_MS = 120000;

const pendingRequests = new Map();

function isEntryExpired(entry) {
  return Date.now() - entry.createdAt > PENDING_TTL_MS;
}

function evictExpired() {
  const now = Date.now();
  for (const [key, entry] of pendingRequests.entries()) {
    if (now - entry.createdAt > PENDING_TTL_MS) {
      entry.reject(new Error("Pending request expired after " + PENDING_TTL_MS + "ms"));
      pendingRequests.delete(key);
    }
  }
}

export function getPendingRequest(cacheKey) {
  const entry = pendingRequests.get(cacheKey);
  if (!entry) return null;
  if (isEntryExpired(entry)) {
    entry.reject(new Error("Pending request expired after " + PENDING_TTL_MS + "ms"));
    pendingRequests.delete(cacheKey);
    return null;
  }
  return entry.promise;
}

export function setPendingRequest(cacheKey, promise) {
  const entry = {
    promise,
    createdAt: Date.now(),
    resolve: null,
    reject: null,
  };
  pendingRequests.set(cacheKey, entry);
}

export function deletePendingRequest(cacheKey) {
  pendingRequests.delete(cacheKey);
}

/**
 * Atomically registers the first request for a cache key.
 *
 * Uses a single atomic Map operation to prevent concurrent duplicate
 * registrations. Bounded to MAX_PENDING_REQUESTS entries with TTL-based
 * eviction to prevent memory leaks under high concurrency.
 *
 * @param {string} cacheKey - The cache key for deduplication
 * @param {number} [ttlMs=120000] - TTL in ms before rejecting the promise
 * @returns {{promise: Promise, isCreator: boolean, resolve: Function, reject: Function}}
 *          The pending promise, whether this call created it, and resolve/reject functions
 */
export function getOrCreatePendingRequest(cacheKey, ttlMs = PENDING_TTL_MS) {
  // Evict expired entries periodically
  if (pendingRequests.size % 100 === 0) {
    evictExpired();
  }

  // Atomic check-and-register: if the key already exists, return existing promise
  const existing = pendingRequests.get(cacheKey);
  if (existing) {
    if (isEntryExpired(existing)) {
      existing.reject(new Error("Pending request expired after " + PENDING_TTL_MS + "ms"));
      pendingRequests.delete(cacheKey);
    } else {
      return { promise: existing.promise, isCreator: false };
    }
  }

  // Enforce maximum map size to prevent memory exhaustion
  if (pendingRequests.size >= MAX_PENDING_REQUESTS) {
    evictExpired();
    if (pendingRequests.size >= MAX_PENDING_REQUESTS) {
      throw new Error("Too many pending requests. Please try again later.");
    }
  }

  // Create a deferred promise
  let resolvePromise, rejectPromise;
  const deferredPromise = new Promise((resolve, reject) => {
    resolvePromise = resolve;
    rejectPromise = reject;
  });

  const entry = {
    promise: deferredPromise,
    createdAt: Date.now(),
    resolve: resolvePromise,
    reject: rejectPromise,
  };

  // Atomic set: register immediately
  pendingRequests.set(cacheKey, entry);

  // Return the entry's promise with resolve/reject that clean up the map
  return {
    promise: deferredPromise,
    isCreator: true,
    resolve: (value) => {
      pendingRequests.delete(cacheKey);
      resolvePromise(value);
    },
    reject: (reason) => {
      pendingRequests.delete(cacheKey);
      rejectPromise(reason);
    },
  };
}
