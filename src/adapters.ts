import type { Snapshot, Finding } from "./types.js";

// Deterministic time source — the engine NEVER calls Date.now() directly,
// so cycles are reproducible and the time-machine stays honest.
export interface Clock {
  nowIso(): string;
}

// The human kill-switch. Checked first, every cycle.
export interface KillSwitch {
  isStopped(): Promise<boolean>;
}

// Single-flight lock so two overlapping heartbeats can't run at once.
export interface LockStore {
  // Returns true if THIS caller acquired the lock; false if already held.
  tryAcquire(name: string): Promise<boolean>;
  release(name: string): Promise<void>;
}

// Append-only persistence for proposals, ROI rows, and time-machine nodes.
export interface Store {
  append(stream: string, record: unknown): Promise<void>;
  read(stream: string): Promise<unknown[]>;
}

// Your money ledger (revenue at purchase, balances). Read-only here.
export interface LedgerSource {
  // Proven drift |balance - SUM(ledger)|. The agent consumes this, never
  // recomputes it (the source owns the atomic read).
  balanceDrift(): Promise<number>;
}

// The upstream provider you resell — its OWN truth, not your mirror.
export interface UpstreamProvider {
  // Provider's real remaining for one entitlement, or null if unreachable.
  realRemaining(entId: string): Promise<number | null>;
}

// Your local mirror of provider quota — the thing that drifts. Read-only here:
// the agent never writes the mirror (the live gate owns it).
export interface MirrorStore {
  snapshotEntitlements(): Promise<Snapshot>;
}

// Where summaries and approval requests go, and where approvals come back.
export interface Notifier {
  send(text: string): Promise<void>;
  // Registers an inbound handler. Implementations call it per inbound message.
  onMessage(handler: (from: string, text: string) => void): void;
}

// The ONLY path a money/state change may take. Idempotent + audited.
// The skeleton never writes money any other way.
export interface ApprovalGate {
  // Applies a change keyed by idempotencyKey. Re-applying the same key is a
  // no-op that returns the same result (double-trigger safety).
  apply(idempotencyKey: string, finding: Finding): Promise<{ applied: boolean }>;
}
