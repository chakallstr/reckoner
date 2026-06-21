// adapters/stub/system-clock.ts
import type { Clock } from "../../src/adapters.js";
// NOTE: real Date is allowed in an ADAPTER (the engine never calls it directly).
export const systemClock: Clock = { nowIso: () => new Date().toISOString() };
