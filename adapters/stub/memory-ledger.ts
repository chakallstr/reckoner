// adapters/stub/memory-ledger.ts
import type { LedgerSource } from "../../src/adapters.js";
export function memoryLedger(drift = 0): LedgerSource {
  return { async balanceDrift() { return drift; } };
}
