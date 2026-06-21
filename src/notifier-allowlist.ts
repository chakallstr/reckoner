import type { Notifier } from "./adapters.js";

// Wraps any Notifier so the agent can physically only talk to ONE recipient,
// in both directions. Outbound is tagged; inbound is dropped unless it is from
// the allowlisted identity (this is also the money-trigger gate).
export class AllowlistNotifier implements Notifier {
  constructor(
    private readonly inner: Notifier,
    private readonly recipient: string,
    private readonly tag: string,
  ) {}

  async send(text: string): Promise<void> {
    // The inner adapter is responsible for routing to exactly `this.recipient`.
    // We tag here; the stub/real adapter is constructed bound to that recipient.
    await this.inner.send(`[${this.tag}] ${text}`);
  }

  onMessage(handler: (from: string, text: string) => void): void {
    this.inner.onMessage((from, text) => {
      if (from !== this.recipient) return; // drop everyone else, silently
      handler(from, text);
    });
  }

  get allowedApprover(): string {
    return this.recipient;
  }
}
