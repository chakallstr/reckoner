import type { Finding, HeartbeatResult } from "./types.js";
import type { KillSwitch, LockStore, MirrorStore, LedgerSource } from "./adapters.js";
import type { Hunter } from "./hunter.js";
import { inv1Balance, inv3UnitConservation } from "./invariants.js";
import { runHunters } from "./hunter.js";

const LOCK_NAME = "reckoner:heartbeat";

export interface HeartbeatDeps {
  nowIso: () => string;
  killSwitch: KillSwitch;
  lock: LockStore;
  mirror: MirrorStore;
  ledger: LedgerSource;
  hunters: Hunter[];
  hysteresis: { confirm(keys: string[]): string[] };
}

// Runs one step, never throwing: failures become broken-module records.
async function step<T>(
  name: string, broken: { module: string; error: string }[], fn: () => Promise<T>,
): Promise<T | undefined> {
  try { return await fn(); }
  catch (e) { broken.push({ module: name, error: e instanceof Error ? e.message : String(e) }); return undefined; }
}

export async function runHeartbeat(deps: HeartbeatDeps): Promise<HeartbeatResult> {
  const ranAt = deps.nowIso();
  const broken: { module: string; error: string }[] = [];

  if (await deps.killSwitch.isStopped()) return { ranAt, skipped: "killed", findings: [], brokenModules: [] };
  if (!(await deps.lock.tryAcquire(LOCK_NAME))) return { ranAt, skipped: "locked", findings: [], brokenModules: [] };

  try {
    const snap = await step("mirror.snapshot", broken, () => deps.mirror.snapshotEntitlements());
    const drift = await step("ledger.balanceDrift", broken, () => deps.ledger.balanceDrift());

    let findings: Finding[] = [];
    if (snap) {
      const withDrift = { ...snap, ledgerBalanceDrift: drift ?? snap.ledgerBalanceDrift };
      findings.push(...inv1Balance(withDrift));
      findings.push(...inv3UnitConservation(withDrift));
      findings.push(...runHunters(withDrift, deps.hunters));
    }

    // 2-tick hysteresis on a stable per-finding key.
    const keyed = new Map(findings.map((f) => [`${f.entId}:${f.invariant}`, f]));
    const confirmedKeys = deps.hysteresis.confirm([...keyed.keys()]);
    const confirmed = confirmedKeys.map((k) => keyed.get(k)!).filter(Boolean);

    return { ranAt, findings: confirmed, brokenModules: broken };
  } finally {
    await deps.lock.release(LOCK_NAME); // always release, even on throw
  }
}
