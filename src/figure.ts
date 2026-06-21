import type { Basis, Unit } from "./types.js";

export interface Figure {
  value: number;
  unit: Unit;
  basis: Basis;
}

export function proven(value: number, unit: Unit): Figure {
  return { value, unit, basis: "proven" };
}

export function estimate(value: number, unit: Unit): Figure {
  return { value, unit, basis: "estimate" };
}

// Quota/package leakage MUST be a count of units, never a currency amount.
export function units(value: number): Figure {
  if (arguments.length > 1) throw new Error("units() takes only a count; leakage is never a currency value");
  return { value, unit: "units", basis: "proven" };
}

export function formatFigure(f: Figure): string {
  const unitLabel = f.unit === "TL" ? " TL" : f.unit === "units" ? " ünite" : "";
  if (f.basis === "estimate") return `≈ ${f.value}${unitLabel} (kanıtlanamaz)`;
  return `${f.value}${unitLabel}`;
}
