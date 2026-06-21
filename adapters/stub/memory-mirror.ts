// adapters/stub/memory-mirror.ts
import type { MirrorStore } from "../../src/adapters.js";
import type { Snapshot } from "../../src/types.js";
export function memoryMirror(snap: Snapshot): MirrorStore {
  return { async snapshotEntitlements() { return snap; } };
}
