// adapters/stub/audit-approval-gate.ts
import type { ApprovalGate } from "../../src/adapters.js";
import type { Finding } from "../../src/types.js";
// Idempotent in-memory gate: the same key applies once, then no-ops.
export function auditApprovalGate() {
  const applied = new Set<string>();
  const log: { key: string; finding: Finding }[] = [];
  const gate: ApprovalGate = {
    async apply(key, finding) {
      if (applied.has(key)) return { applied: false };
      applied.add(key); log.push({ key, finding }); return { applied: true };
    },
  };
  return { gate, log };
}
