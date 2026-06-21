import { describe, it, expect } from "vitest";
import { inv1Balance, inv3UnitConservation, HysteresisTracker } from "../src/invariants.js";
import type { Snapshot, EntitlementRow } from "../src/types.js";

function ent(p: Partial<EntitlementRow>): EntitlementRow {
  return {
    entId: "e1", customerId: "c1", unitsOrdered: 100, mirrorRemaining: 40,
    mirrorAgeSec: 10, successUsageCount: 60, recentUsageSec: 9999,
    provisioningMode: "lazy", status: "active", fulfilled: true, refunded: false, paid: true,
    ...p,
  };
}
const snap = (rows: EntitlementRow[], drift = 0): Snapshot =>
  ({ takenAt: "2026-06-21T10:00:00Z", entitlements: rows, ledgerBalanceDrift: drift });

describe("inv1Balance", () => {
  it("flags drift above tolerance, ignores drift within it", () => {
    expect(inv1Balance(snap([], 0.00005))).toHaveLength(0);
    expect(inv1Balance(snap([], 0.5))).toHaveLength(1);
  });
});

describe("inv3UnitConservation", () => {
  it("is balanced when ordered - remaining == success count", () => {
    expect(inv3UnitConservation(snap([ent({ unitsOrdered: 100, mirrorRemaining: 40, successUsageCount: 60 })]))).toHaveLength(0);
  });
  it("flags conservation breaks in units, never currency", () => {
    const f = inv3UnitConservation(snap([ent({ unitsOrdered: 100, mirrorRemaining: 40, successUsageCount: 70 })]));
    expect(f).toHaveLength(1);
    expect(f[0].owedUnits).toBe(10);
    expect(f[0].detail).not.toMatch(/TL/);
  });
  it("defers (no finding) when a request flew in within the tolerance window", () => {
    const rows = [ent({ unitsOrdered: 100, mirrorRemaining: 40, successUsageCount: 70, recentUsageSec: 5 })];
    expect(inv3UnitConservation(snap(rows))).toHaveLength(0);
  });
});

describe("HysteresisTracker", () => {
  it("only surfaces a finding after it survives two consecutive cycles", () => {
    const t = new HysteresisTracker();
    const key = "e1:INV3";
    expect(t.confirm([key])).toEqual([]);   // cycle 1: provisional
    expect(t.confirm([key])).toEqual([key]); // cycle 2: confirmed
  });
  it("drops a finding that did not survive", () => {
    const t = new HysteresisTracker();
    t.confirm(["e1:INV3"]);
    expect(t.confirm([])).toEqual([]);       // disappeared -> not confirmed
  });
});
