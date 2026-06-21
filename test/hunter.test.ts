import { describe, it, expect } from "vitest";
import { paidButUnusable, runHunters } from "../src/hunter.js";
import type { Snapshot, EntitlementRow } from "../src/types.js";

function ent(p: Partial<EntitlementRow>): EntitlementRow {
  return {
    entId: "e1", customerId: "c1", unitsOrdered: 100, mirrorRemaining: 40,
    mirrorAgeSec: 10, successUsageCount: 60, recentUsageSec: 9999,
    provisioningMode: "lazy", status: "active", fulfilled: true, refunded: false, paid: true,
    ...p,
  };
}
const snap = (rows: EntitlementRow[]): Snapshot =>
  ({ takenAt: "2026-06-21T10:00:00Z", entitlements: rows, ledgerBalanceDrift: 0 });

describe("paidButUnusable", () => {
  it("flags paid + not fulfilled + not refunded", () => {
    const f = paidButUnusable(snap([ent({ paid: true, fulfilled: false, refunded: false })]));
    expect(f).toHaveLength(1);
    expect(f[0].invariant).toBe("H1");
  });
  it("does not flag when a refund exists", () => {
    expect(paidButUnusable(snap([ent({ paid: true, fulfilled: false, refunded: true })]))).toHaveLength(0);
  });
});

describe("runHunters liveness", () => {
  it("emits a BLIND finding when zero candidates were scanned but active entitlements exist", () => {
    // A hunter that always scans nothing.
    const blindHunter = { name: "noop", run: () => ({ findings: [], scanned: 0 }) };
    const f = runHunters(snap([ent({ status: "active" })]), [blindHunter]);
    expect(f.some((x) => x.severity === "blind")).toBe(true);
  });
  it("does not emit BLIND when the hunter actually scanned candidates", () => {
    const okHunter = { name: "ok", run: (s: Snapshot) => ({ findings: [], scanned: s.entitlements.length }) };
    const f = runHunters(snap([ent({})]), [okHunter]);
    expect(f.some((x) => x.severity === "blind")).toBe(false);
  });
});
