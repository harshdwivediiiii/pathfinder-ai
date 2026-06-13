import "server-only";
import { createMemoryCacheStore } from "./store.js";

let _memoryStore;
export function getMemoryStore() {
  if (!_memoryStore) {
    _memoryStore = createMemoryCacheStore({ cleanupIntervalMs: 0 });
  }
  return _memoryStore;
}
