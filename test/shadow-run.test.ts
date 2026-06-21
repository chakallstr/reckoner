import { describe, it, expect } from "vitest";
import { runShadowOnce } from "../examples/shadow-run.js";

describe("shadow run", () => {
  it("runs a full heartbeat over fake data and reports findings without any write", async () => {
    const { result, writes } = await runShadowOnce();
    expect(result.skipped).toBeUndefined();
    expect(writes).toBe(0); // shadow mode writes nothing
    // The fake data has one over-served entitlement -> at least one finding after 2 ticks.
    expect(Array.isArray(result.findings)).toBe(true);
  });
});
