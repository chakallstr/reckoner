import { describe, it, expect } from "vitest";
import { deriveIdempotencyKey } from "../src/idempotency.js";
import type { Finding } from "../src/types.js";

const base: Finding = {
  entId: "ent_42", invariant: "INV3", severity: "high",
  owedUnits: 50, day: "2026-06-21", detail: "x",
};

describe("deriveIdempotencyKey", () => {
  it("is byte-identical for the same finding identity regardless of detail text", () => {
    const a = deriveIdempotencyKey(base);
    const b = deriveIdempotencyKey({ ...base, detail: "completely different wording" });
    expect(a).toBe(b);
  });

  it("does NOT depend on volatile fields (severity)", () => {
    expect(deriveIdempotencyKey(base)).toBe(deriveIdempotencyKey({ ...base, severity: "med" }));
  });

  it("differs when the real problem differs (owedUnits)", () => {
    expect(deriveIdempotencyKey(base)).not.toBe(deriveIdempotencyKey({ ...base, owedUnits: 51 }));
  });

  it("has a stable, readable shape", () => {
    expect(deriveIdempotencyKey(base)).toBe("fix_ent_42_INV3_50_2026-06-21");
  });
});
