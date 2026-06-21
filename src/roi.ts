import { proven, units, formatFigure } from "./figure.js";

// Tracks the agent's own cost vs what it caught. Caught currency is ALWAYS
// proven; quota leakage is ALWAYS units. There is no path to print an
// estimate as a bare currency value.
export class RoiLedger {
  private costTl = 0;
  private caughtTl = 0;
  private caughtUnits = 0;

  accrueCost(tl: number): void { this.costTl += tl; }

  accrueCaughtTl(tl: number): void {
    if (arguments.length > 1) throw new Error("caught TL must be proven; no estimate overload");
    this.caughtTl += tl;
  }

  accrueCaughtUnits(u: number): void { this.caughtUnits += u; }

  report(): string {
    const lines = [
      `Maliyetim: ${formatFigure(proven(this.costTl, "TL"))}`,
      `Yakalanan (kanıtlı): ${formatFigure(proven(this.caughtTl, "TL"))}`,
    ];
    if (this.caughtUnits > 0) lines.push(`Yakalanan kota: ${formatFigure(units(this.caughtUnits))}`);
    return lines.join("\n");
  }
}
