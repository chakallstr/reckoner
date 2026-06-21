// Severity of a finding. "blind" is special: a checker that produced no
// candidates while live data clearly exists — never treat that as "all clear".
export type Severity = "info" | "low" | "med" | "high" | "blind";

// What a number is grounded in. Encodes design-invariant #4: estimates can
// never masquerade as proven facts.
export type Basis = "proven" | "estimate";

// Units a figure is measured in. Package/quota leakage uses "units", never "TL".
export type Unit = "TL" | "units" | "count";

// One consistent read of the world. Adapters fill this; the engine never
// re-reads mid-cycle (design-invariant: single consistent snapshot).
export interface Snapshot {
  takenAt: string; // ISO timestamp, supplied by Clock (never Date.now in engine)
  entitlements: EntitlementRow[];
  ledgerBalanceDrift: number; // proven by the ledger source (e.g. |balance - SUM|)
}

export interface EntitlementRow {
  entId: string;
  customerId: string;
  unitsOrdered: number;     // units we ordered from the upstream provider
  mirrorRemaining: number | null; // our local mirror of provider remaining (volatile)
  mirrorAgeSec: number | null;    // age of the mirror value in seconds
  successUsageCount: number;      // proven count of successful served requests
  recentUsageSec: number | null;  // seconds since last usage row (null = none)
  provisioningMode: "lazy" | "fixed";
  status: "active" | "paused" | "expired";
  fulfilled: boolean;       // provider actually delivered what was paid for
  refunded: boolean;        // a matching refund exists
  paid: boolean;            // a purchase/grant exists for this entitlement
}

// A detected problem. Its identity (entId+invariant+day+owedUnits) is the
// ONLY thing money idempotency keys derive from (design-invariant #3).
export interface Finding {
  entId: string;
  invariant: string;        // e.g. "INV3" | "H1" | "BALANCE_DRIFT"
  severity: Severity;
  owedUnits: number;        // 0 when not a quota-owed finding
  day: string;              // "YYYY-MM-DD" from snapshot.takenAt
  detail: string;           // human-readable, deterministic (no arithmetic by an LLM)
}

export type ProposalStatus =
  | "proposed"   // waiting for the human trigger
  | "approved"   // human approved; awaiting execution re-check
  | "executed"   // applied through the ApprovalGate
  | "rejected"   // human said no
  | "stale";     // world moved between propose and execute; re-opened

export interface Proposal {
  id: string;            // == idempotency key (finding-derived, stable)
  finding: Finding;
  status: ProposalStatus;
  createdAt: string;
  decidedAt?: string;
}

export interface HeartbeatResult {
  ranAt: string;
  skipped?: "killed" | "locked";
  findings: Finding[];
  brokenModules: { module: string; error: string }[];
}
