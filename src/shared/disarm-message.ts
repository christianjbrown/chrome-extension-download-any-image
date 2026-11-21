// The service worker asks a page to stop waiting for the click.
import { isMessageOf } from "./message-checks";
import { PAGE } from "./message-targets";
import type { MessageGuard } from "./routing";

export const DISARM = "disarm";

export interface DisarmMessage {
  target: typeof PAGE;
  type: typeof DISARM;
}

// The one thing the page script is ever asked.
export const DISARM_MESSAGE: DisarmMessage = { target: PAGE, type: DISARM };

// A disarm carries nothing but its type.
export class DisarmGuard implements MessageGuard<DisarmMessage> {
  readonly type = DISARM;

  admits(message: unknown): message is DisarmMessage {
    return isMessageOf(message, PAGE, this.type);
  }
}
