import { DISARM, type PageMessage } from "../shared/messages";
import { fieldAt, hasMethods } from "./checks";
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

// What a session kept in the slot has to be able to do.
const SESSION_METHODS = ["disarm"];

// Whatever a frame's slot holds is the page's to change too, so it is checked
// before it is used.
function isDisarmable(value: unknown): value is Disarmable {
  return hasMethods(value, SESSION_METHODS);
}

// Where a frame keeps its armed session, so a second injection can find it.
export class FrameSlot {
  constructor(
    private readonly store: object,
    private readonly key: string,
  ) {}

  // A second injection into a frame that is still armed replaces the first.
  clear(): void {
    this.held()?.disarm();
  }

  keep(session: Disarmable): void {
    Reflect.set(this.store, this.key, session);
  }

  private held(): Disarmable | undefined {
    const held = fieldAt(this.store, this.key);
    return isDisarmable(held) ? held : undefined;
  }
}
