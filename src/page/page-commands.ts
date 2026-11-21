import { DISARM, type PageMessage } from "../shared/messages";
import type { Command } from "../shared/routing";
import type { Disarmable } from "./pick-control";

// What the service worker can ask of a frame: only to stop waiting, which
// always works.
export class DisarmCommand implements Command<PageMessage, typeof DISARM> {
  readonly type = DISARM;

  constructor(private readonly session: Disarmable) {}

  handle(): Promise<boolean> {
    this.session.disarm();
    return Promise.resolve(true);
  }
}

// Where a frame keeps its armed session, so a second injection can find it.
export class FrameSlot {
  constructor(
    private readonly store: Record<string, Disarmable | undefined>,
    private readonly key: string,
  ) {}

  // A second injection into a frame that is still armed replaces the first.
  clear(): void {
    this.store[this.key]?.disarm();
  }

  keep(session: Disarmable): void {
    this.store[this.key] = session;
  }
}
