# reckoner

> A trustworthy financial-reconciliation ops agent — **skeleton**.

`reckoner` is an open-source scaffold for an autonomous agent that sits **between you and an upstream provider** (a reseller, an API vendor, any metered upstream you resell) and keeps the money **truthful**.

It wakes on a heartbeat, pulls the provider's *real* numbers, reconciles them against your own ledger and your local mirror, **auto-fixes only what is provably correct**, and brings everything ambiguous to a human with the evidence attached.

This repository is intentionally **hollow**: it ships the framework, the safety rails, and stub adapters — *not* a working integration. You implement the adapters for your own system.

---

## Core principle: never-wrong math

The agent **never lets a language model do arithmetic.** Every figure it reports — revenue, cost, margin, remaining quota, a desync delta — is a deterministic database `SUM`/`COUNT` or a column value. The LLM only **narrates, triages, and explains**. If a number can't be derived deterministically, the agent says *"I don't have a deterministic query for that"* instead of guessing.

## What it does (the design)

- **Hourly heartbeat** — checks its own health, pulls the provider's real remaining, reconciles `your ledger ↔ mirror ↔ provider truth`, asks three questions (*books balance? a paying customer locked out? free service leaking?*), then either fixes or proposes.
- **Auto-fix vs. approval** — only **provable, deterministic, reversible** corrections are applied automatically. Anything ambiguous or money-adjacent is **proposed**, never executed by the agent alone.
- **Shadow → trusted** — starts read-only. It earns trust with numbers (backtests its own proposals against what actually happened) before any write is ever enabled.
- **Two-signature (maker-checker)** — large money moves require *agent proposes + human approves + an independent deterministic check passes* before commit.
- **Silent-failure hunting** — the most dangerous class: things that fail with **no error**. It actively looks for *"should have happened but there is no record"* (paid-but-not-provisioned, ordered-but-not-delivered, an update that silently no-op'd).
- **Self-cost / ROI** — tracks its own running cost and reports honestly what it caught for what it cost.
- **Time machine** — reconstructs any past point-in-time state from an immutable ledger, so disputes resolve in seconds.
- **Mitosis (optional)** — when one worker can't cover the work, it spawns budget-bounded copies that investigate and cross-verify; their findings merge back into shared memory. **Copies never write money** — a single audited authority does.

## The "hollow" part: adapters you implement

`reckoner` defines small, single-purpose interfaces and ships **no real backend**:

| Adapter | Responsibility |
|---|---|
| `LedgerSource` | Your money ledger (revenue recognized at purchase, per-use charges, balances). |
| `UpstreamProvider` | The provider you resell — its *real* remaining/usage truth. |
| `MirrorStore` | Your local mirror of provider quota (the thing that drifts). |
| `Notifier` | Where summaries and approval requests go (chat, email, …). |
| `ApprovalGate` | The audited, idempotent path money moves must go through — **never raw SQL**. |

Bring your own implementations; the framework wires the heartbeat, reconciliation, safety rails, and rollout around them.

## Status

🚧 **Early skeleton.** Interfaces and the orchestration shell are being filled in. Not production-ready.

## Safety

This agent touches **money**. Two non-negotiables baked into the design:

1. **Shadow first.** It reads and proposes long before it is ever allowed to write.
2. **No raw money writes.** Every monetary change flows through your audited, idempotent `ApprovalGate` — the agent proposes through it, it does not forge writes.

`reckoner` is a generic scaffold and is **not affiliated with or specific to any payment system or provider.** No credentials, hosts, or operational details belong in this repository — keep those in your own private adapter implementations.

## Quick start (shadow run)

```bash
npm install
npm test           # full suite
npm run example    # one shadow heartbeat over fake data — writes nothing
```

Implement the five adapters in `src/adapters.ts` for your own system, wire them
the way `examples/shadow-run.ts` wires the stubs, and run it on a timer.

## License

[MIT](./LICENSE) © chakallstr
