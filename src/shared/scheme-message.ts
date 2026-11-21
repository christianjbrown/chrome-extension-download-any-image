// The offscreen document saw the device's colour scheme.
import { isColourScheme, type ColourScheme } from "./colour-scheme";
import { isMessageOf } from "./message-checks";
import { BACKGROUND } from "./message-targets";
import type { MessageGuard } from "./routing";

export const SCHEME = "scheme";

export interface SchemeMessage {
  target: typeof BACKGROUND;
  type: typeof SCHEME;
  scheme: ColourScheme;
}

// The colour scheme the offscreen document sees.
export class SchemeGuard implements MessageGuard<SchemeMessage> {
  readonly type = SCHEME;

  admits(message: unknown): message is SchemeMessage {
    return (
      isMessageOf(message, BACKGROUND, this.type) &&
      isColourScheme(message.scheme)
    );
  }
}
