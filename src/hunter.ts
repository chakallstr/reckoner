import type { Snapshot, Finding } from "./types.js";

export interface Hunter {
  name: string;
  // Returns findings AND how many candidates it actually examined.
  run(snap: Snapshot): { findings: Finding[]; scanned: number };
}

const day = (s: Snapshot) => s.takenAt.slice(0, 10);

// H1: paid, but the entitlement is neither usable (fulfilled) nor refunded.
export function paidButUnusable(snap: Snapshot): Finding[] {
  const out: Finding[] = [];
  for (const e of snap.entitlements) {
    if (e.paid && !e.fulfilled && !e.refunded) {
      out.push({
        entId: e.entId, invariant: "H1", severity: "high", owedUnits: 0, day: day(snap),
        detail: `Ödendi ama kullanılabilir değil (fulfilled=false, refund yok): ${e.customerId}`,
      });
    }
  }
  return out;
}

export function runHunters(snap: Snapshot, hunters: Hunter[]): Finding[] {
  const findings: Finding[] = [];
  let totalScanned = 0;
  for (const h of hunters) {
    const r = h.run(snap);
    findings.push(...r.findings);
    totalScanned += r.scanned;
  }
  const activeExist = snap.entitlements.some((e) => e.status === "active");
  if (totalScanned === 0 && activeExist) {
    findings.push({
      entId: "-", invariant: "HUNTER_LIVENESS", severity: "blind", owedUnits: 0, day: day(snap),
      detail: "Avcı kör: aktif paket var ama hiç aday taranmadı — bu YEŞİL değildir.",
    });
  }
  return findings;
}
