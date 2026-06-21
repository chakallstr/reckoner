import { describe, it, expect, vi } from "vitest";
import { AllowlistNotifier } from "../src/notifier-allowlist.js";
import type { Notifier } from "../src/adapters.js";

function fakeNotifier() {
  let handler: ((from: string, text: string) => void) | null = null;
  return {
    sent: [] as string[],
    notifier: {
      send: vi.fn(async function (this: any, t: string) { this.sent?.push?.(t); }),
      onMessage: (h: (from: string, text: string) => void) => { handler = h; },
    } as Notifier,
    deliver: (from: string, text: string) => handler?.(from, text),
  };
}

describe("AllowlistNotifier", () => {
  it("tags and sends to the configured recipient only", async () => {
    const inner = { send: vi.fn(async () => {}), onMessage: () => {} } as Notifier;
    const n = new AllowlistNotifier(inner, "+905319310781", "CF-Brain");
    await n.send("durum ok");
    expect(inner.send).toHaveBeenCalledWith("[CF-Brain] durum ok");
  });

  it("delivers inbound ONLY from the allowlisted number", () => {
    let handler: ((from: string, text: string) => void) | null = null;
    const inner = { send: async () => {}, onMessage: (h: any) => { handler = h; } } as Notifier;
    const n = new AllowlistNotifier(inner, "+905319310781", "CF-Brain");
    const seen: string[] = [];
    n.onMessage((_from, text) => seen.push(text));

    handler!("+905319310781", "onayla 1");   // allowed
    handler!("+900000000000", "onayla 1");   // blocked
    expect(seen).toEqual(["onayla 1"]);
  });
});
