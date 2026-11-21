import type { CommandHandlers } from "../shared/command-router";
import type { PageMessage } from "../shared/messages";

// Something that can stop waiting for the click.
export interface Disarmable {
  disarm(): void;
}

// What the service worker can ask of a frame: only to stop waiting, which
// always works.
export class PageCommands implements CommandHandlers<PageMessage> {
  constructor(private readonly session: Disarmable) {}

  readonly disarm = (): Promise<boolean> => {
    this.session.disarm();
    return Promise.resolve(true);
  };
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
