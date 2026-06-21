import type { Finding, Proposal } from "./types.js";
import type { ApprovalGate } from "./adapters.js";
import { deriveIdempotencyKey } from "./idempotency.js";

export function makeProposal(finding: Finding, createdAt: string): Proposal {
  return { id: deriveIdempotencyKey(finding), finding, status: "proposed", createdAt };
}

export interface ApproveContext {
  approver: string;          // who is approving (an identity from the Notifier)
  allowedApprover: string;   // the single allowlisted approver
  recheck: (finding: Finding) => Promise<boolean>; // re-verify vs FRESH snapshot
  gate: ApprovalGate;
  nowIso: () => string;
}

export async function approveAndExecute(p: Proposal, ctx: ApproveContext): Promise<Proposal> {
  if (ctx.approver !== ctx.allowedApprover) {
    return { ...p, status: "rejected", decidedAt: ctx.nowIso() };
  }
  // Re-check against a fresh read: never act on a moving target.
  const stillValid = await ctx.recheck(p.finding);
  if (!stillValid) {
    return { ...p, status: "stale", decidedAt: ctx.nowIso() };
  }
  await ctx.gate.apply(p.id, p.finding); // idempotent: re-trigger is a no-op
  return { ...p, status: "executed", decidedAt: ctx.nowIso() };
}
