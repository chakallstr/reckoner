// adapters/stub/file-killswitch.ts
import { existsSync } from "node:fs";
import type { KillSwitch } from "../../src/adapters.js";
// Stop the agent by creating the file at `path` (e.g. "STOP").
export function fileKillSwitch(path: string): KillSwitch {
  return { async isStopped() { return existsSync(path); } };
}
