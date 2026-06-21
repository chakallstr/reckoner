import { describe, it, expect, vi } from "vitest";
import { makeProposal, approveAndExecute } from "../src/proposals.js";
import type { Finding } from "../src/types.js";
import type { ApprovalGate } from "../src/adapters.js";

const finding: Finding = {
  entId: "e1", invariant: "INV3", severity: "high", owedUnits: 50,
  day: "2026-06-21", detail: "x",
};
const gate: ApprovalGate = { apply: vi.fn(async () => ({ applied: true })) };

describe("proposals", () => {
  it("derives the proposal id from the finding (stable idempotency)", () => {
    expect(makeProposal(finding, "2026-06-21T10:00:00Z").id).toBe("fix_e1_INV3_50_2026-06-21");
  });

  it("rejects an approval from anyone but the allowlisted approver", async () => {
    const p = makeProposal(finding, "2026-06-21T10:00:00Z");
    const res = await approveAndExecute(p, {
      approver: "+905319310781", allowedApprover: "+905319310781",
      recheck: async () => true, gate, nowIso: () => "2026-06-21T10:05:00Z",
    });
    expect(res.status).toBe("executed");

    const bad = await approveAndExecute(makeProposal(finding, "t"), {
      approver: "+900000000000", allowedApprover: "+905319310781",
      recheck: async () => true, gate, nowIso: () => "t2",
    });
    expect(bad.status).toBe("rejected");
  });

  it("goes stale (does NOT apply) when the fresh re-check fails", async () => {
    const applySpy = vi.fn(async () => ({ applied: true }));
    const res = await approveAndExecute(makeProposal(finding, "t"), {
      approver: "+905319310781", allowedApprover: "+905319310781",
      recheck: async () => false, gate: { apply: applySpy }, nowIso: () => "t2",
    });
    expect(res.status).toBe("stale");
    expect(applySpy).not.toHaveBeenCalled();
  });

  it("applies through the gate exactly once, keyed by the proposal id", async () => {
    const applySpy = vi.fn(async () => ({ applied: true }));
    const p = makeProposal(finding, "t");
    await approveAndExecute(p, {
      approver: "+905319310781", allowedApprover: "+905319310781",
      recheck: async () => true, gate: { apply: applySpy }, nowIso: () => "t2",
    });
    expect(applySpy).toHaveBeenCalledWith(p.id, finding);
  });
});
