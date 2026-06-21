import { describe, it, expect, vi } from "vitest";
import { runHeartbeat } from "../src/heartbeat.js";
import type { Snapshot } from "../src/types.js";
import type { KillSwitch, LockStore, MirrorStore, LedgerSource } from "../src/adapters.js";

const okSnap: Snapshot = { takenAt: "2026-06-21T10:00:00Z", entitlements: [], ledgerBalanceDrift: 0 };

function deps(over: Partial<Parameters<typeof runHeartbeat>[0]> = {}) {
  return {
    nowIso: () => "2026-06-21T10:00:00Z",
    killSwitch: { isStopped: async () => false } as KillSwitch,
    lock: { tryAcquire: async () => true, release: async () => {} } as LockStore,
    mirror: { snapshotEntitlements: async () => okSnap } as MirrorStore,
    ledger: { balanceDrift: async () => 0 } as LedgerSource,
    hunters: [],
    hysteresis: { confirm: (k: string[]) => k },
    ...over,
  };
}

describe("runHeartbeat", () => {
  it("skips silently when the kill-switch is on", async () => {
    const r = await runHeartbeat(deps({ killSwitch: { isStopped: async () => true } }));
    expect(r.skipped).toBe("killed");
  });

  it("skips silently when the single-flight lock is already held", async () => {
    const r = await runHeartbeat(deps({ lock: { tryAcquire: async () => false, release: async () => {} } }));
    expect(r.skipped).toBe("locked");
  });

  it("records a broken module instead of throwing", async () => {
    const r = await runHeartbeat(deps({
      mirror: { snapshotEntitlements: async () => { throw new Error("db down"); } },
    }));
    expect(r.skipped).toBeUndefined();
    expect(r.brokenModules.some((m) => m.error.includes("db down"))).toBe(true);
  });

  it("always releases the lock, even when a step throws", async () => {
    const release = vi.fn(async () => {});
    await runHeartbeat(deps({
      lock: { tryAcquire: async () => true, release },
      mirror: { snapshotEntitlements: async () => { throw new Error("boom"); } },
    }));
    expect(release).toHaveBeenCalled();
  });
});
