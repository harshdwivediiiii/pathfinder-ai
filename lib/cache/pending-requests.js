import "server-only";

const pendingRequests = new Map();

export function getPendingRequest(cacheKey) {
  return pendingRequests.get(cacheKey) ?? null;
}

export function setPendingRequest(cacheKey, promise) {
  pendingRequests.set(cacheKey, promise);
}

export function deletePendingRequest(cacheKey) {
  pendingRequests.delete(cacheKey);
}

export async function withRequestDeduplication(cacheKey, generateFn) {
  const existing = getPendingRequest(cacheKey);
  if (existing) {
    return existing;
  }

  const promise = generateFn()
    .then((result) => {
      deletePendingRequest(cacheKey);
      return result;
    })
    .catch((error) => {
      deletePendingRequest(cacheKey);
      throw error;
    });

  setPendingRequest(cacheKey, promise);
  return promise;
}
