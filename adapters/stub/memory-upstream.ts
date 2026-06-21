// adapters/stub/memory-upstream.ts
import type { UpstreamProvider } from "../../src/adapters.js";
export function memoryUpstream(remaining: Record<string, number | null> = {}): UpstreamProvider {
  return { async realRemaining(entId) { return entId in remaining ? remaining[entId] : null; } };
}
