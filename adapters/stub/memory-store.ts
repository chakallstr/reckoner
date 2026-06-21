// adapters/stub/memory-store.ts
import type { Store } from "../../src/adapters.js";
export function memoryStore(): Store {
  const streams = new Map<string, unknown[]>();
  return {
    async append(s, r) { (streams.get(s) ?? streams.set(s, []).get(s)!).push(r); },
    async read(s) { return streams.get(s) ?? []; },
  };
}
