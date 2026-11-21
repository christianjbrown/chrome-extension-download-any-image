// A page stopped waiting with nothing picked.
import { isMessageOf } from "./message-checks";
import { BACKGROUND } from "./message-targets";
import type { MessageGuard } from "./routing";

export const DISARMED = "disarmed";

export interface DisarmedMessage {
  target: typeof BACKGROUND;
  type: typeof DISARMED;
}

// A page that has stopped picking carries nothing but its type.
export class DisarmedGuard implements MessageGuard<DisarmedMessage> {
  readonly type = DISARMED;

  admits(message: unknown): message is DisarmedMessage {
    return isMessageOf(message, BACKGROUND, this.type);
  }
}
