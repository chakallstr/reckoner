import { describe, it, expect } from "vitest";
import { proven, estimate, units, formatFigure } from "../src/figure.js";

describe("Figure", () => {
  it("renders a proven TL figure bare", () => {
    expect(formatFigure(proven(1065, "TL"))).toBe("1065 TL");
  });

  it("marks an estimate as unprovable so it can never look proven", () => {
    expect(formatFigure(estimate(190.11, "TL"))).toBe("≈ 190.11 TL (kanıtlanamaz)");
  });

  it("reports quota leakage in units, never TL", () => {
    expect(formatFigure(units(12))).toBe("12 ünite");
  });

  it("refuses to build a unit-leak figure in TL (compile + runtime guard)", () => {
    // @ts-expect-error units() takes a count, not a currency
    expect(() => units(12, "TL")).toThrow();
  });
});
