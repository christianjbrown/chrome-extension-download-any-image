import { DISARM, type DisarmMessage } from "../shared/disarm-message";
import type { Command } from "../shared/routing";
import type { Disarmable } from "./pick-control";

// What the service worker can ask of a frame: only to stop waiting, which
// always works.
export class DisarmCommand implements Command<DisarmMessage> {
  readonly type = DISARM;

  constructor(private readonly session: Disarmable) {}

  handle(): Promise<boolean> {
    this.session.disarm();
    return Promise.resolve(true);
  }
}
