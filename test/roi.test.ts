import { describe, it, expect } from "vitest";
import { RoiLedger } from "../src/roi.js";

describe("RoiLedger", () => {
  it("reports own cost and proven caught TL plainly", () => {
    const r = new RoiLedger();
    r.accrueCost(40);            // our own running cost (proven, in TL)
    r.accrueCaughtTl(1065);      // a proven currency recovery
    const rep = r.report();
    expect(rep).toContain("Maliyetim: 40 TL");
    expect(rep).toContain("Yakalanan (kanıtlı): 1065 TL");
  });

  it("reports quota leakage in units, never as TL", () => {
    const r = new RoiLedger();
    r.accrueCaughtUnits(12);
    const rep = r.report();
    expect(rep).toContain("12 ünite");
    expect(rep).not.toMatch(/12 TL/);
  });

  it("refuses to accrue caught TL from an unprovable basis", () => {
    const r = new RoiLedger();
    // @ts-expect-error caught TL must be proven; there is no estimate overload
    expect(() => r.accrueCaughtTl(190, "estimate")).toThrow();
  });
});
