import type { Finding } from "./types.js";

// Key derives ONLY from the identity of the real problem: which entitlement,
// which invariant, how much is owed, on which day. Never from a snapshot hash
// or any volatile value.
export function deriveIdempotencyKey(f: Finding): string {
  return `fix_${f.entId}_${f.invariant}_${f.owedUnits}_${f.day}`;
}
