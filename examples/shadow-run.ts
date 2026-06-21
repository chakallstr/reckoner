import { runHeartbeat } from "../src/heartbeat.js";
import { HysteresisTracker } from "../src/invariants.js";
import { paidButUnusable } from "../src/hunter.js";
import { memoryMirror } from "../adapters/stub/memory-mirror.js";
import { memoryLedger } from "../adapters/stub/memory-ledger.js";
import { memoryLock } from "../adapters/stub/memory-lock.js";
import { auditApprovalGate } from "../adapters/stub/audit-approval-gate.js";
import type { Snapshot } from "../src/types.js";
import type { KillSwitch } from "../src/adapters.js";

const fakeSnap: Snapshot = {
  takenAt: "2026-06-21T10:00:00Z",
  ledgerBalanceDrift: 0,
  entitlements: [
    // over-served: ordered 100, remaining 40 -> consumed 60, but only 55 success rows
    { entId: "e1", customerId: "ahmet", unitsOrdered: 100, mirrorRemaining: 40, mirrorAgeSec: 120,
      successUsageCount: 55, recentUsageSec: 9999, provisioningMode: "lazy", status: "active",
      fulfilled: true, refunded: false, paid: true },
  ],
};

export async function runShadowOnce() {
  const { gate, log } = auditApprovalGate();
  const hysteresis = new HysteresisTracker();
  const deps = {
    nowIso: () => "2026-06-21T10:00:00Z",
    killSwitch: { isStopped: async () => false } as KillSwitch,
    lock: memoryLock(),
    mirror: memoryMirror(fakeSnap),
    ledger: memoryLedger(0),
    hunters: [{ name: "H1", run: (s: Snapshot) => ({ findings: paidButUnusable(s), scanned: s.entitlements.length }) }],
    hysteresis,
  };
  await runHeartbeat(deps);          // tick 1 (provisional)
  const result = await runHeartbeat(deps); // tick 2 (confirmed)
  // shadow: we never call gate.apply, so writes stays 0
  return { result, writes: log.length };
}

// Allow `npm run example` to print a summary.
if (import.meta.url === `file://${process.argv[1]}`) {
  runShadowOnce().then(({ result, writes }) => {
    console.log("findings:", result.findings);
    console.log("broken:", result.brokenModules);
    console.log("writes:", writes);
  });
}
