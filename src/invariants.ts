import type { Snapshot, Finding } from "./types.js";

const BALANCE_TOLERANCE = 0.0001;
const FLIGHT_TOLERANCE_SEC = 60; // a request newer than this may be mid-write

function day(snap: Snapshot): string {
  return snap.takenAt.slice(0, 10);
}

export function inv1Balance(snap: Snapshot): Finding[] {
  if (Math.abs(snap.ledgerBalanceDrift) < BALANCE_TOLERANCE) return [];
  return [{
    entId: "-", invariant: "BALANCE_DRIFT", severity: "high", owedUnits: 0,
    day: day(snap), detail: `Ledger drift ${snap.ledgerBalanceDrift}`,
  }];
}

export function inv3UnitConservation(snap: Snapshot): Finding[] {
  const out: Finding[] = [];
  for (const e of snap.entitlements) {
    if (e.mirrorRemaining === null) continue; // mirror absent -> advisory only, no claim
    if (e.recentUsageSec !== null && e.recentUsageSec < FLIGHT_TOLERANCE_SEC) continue; // in-flight, defer
    const consumed = e.unitsOrdered - e.mirrorRemaining;
    const owed = consumed - e.successUsageCount;
    if (owed === 0) continue;
    out.push({
      entId: e.entId, invariant: "INV3", severity: "high", owedUnits: Math.abs(owed),
      day: day(snap),
      detail: `Birim korunumu kırık: tüketilen ${consumed} vs başarılı ${e.successUsageCount} (fark ${Math.abs(owed)} ünite)`,
    });
  }
  return out;
}

// Requires a finding key to appear in two consecutive cycles before it is
// "real". Cross-cycle memory lives in the caller (one tracker instance reused).
export class HysteresisTracker {
  private prev = new Set<string>();
  confirm(currentKeys: string[]): string[] {
    const cur = new Set(currentKeys);
    const confirmed = currentKeys.filter((k) => this.prev.has(k));
    this.prev = cur;
    return confirmed;
  }
}
