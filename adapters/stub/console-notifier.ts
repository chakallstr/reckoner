// adapters/stub/console-notifier.ts
import type { Notifier } from "../../src/adapters.js";
// Prints outbound; lets tests/examples push inbound via `deliver`.
export function consoleNotifier() {
  let handler: ((from: string, text: string) => void) | null = null;
  const notifier: Notifier = {
    async send(text) { console.log("[notify]", text); },
    onMessage(h) { handler = h; },
  };
  return { notifier, deliver: (from: string, text: string) => handler?.(from, text) };
}
