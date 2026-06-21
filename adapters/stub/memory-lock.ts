// adapters/stub/memory-lock.ts
import type { LockStore } from "../../src/adapters.js";
export function memoryLock(): LockStore {
  const held = new Set<string>();
  return {
    async tryAcquire(name) { if (held.has(name)) return false; held.add(name); return true; },
    async release(name) { held.delete(name); },
  };
}
