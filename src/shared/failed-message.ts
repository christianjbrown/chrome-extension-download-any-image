// A page could not read the picture it picked.
import { isMessageOf, isShortText } from "./message-checks";
import { BACKGROUND } from "./message-targets";
import type { MessageGuard } from "./routing";

export const FAILED = "failed";

export interface FailedMessage {
  target: typeof BACKGROUND;
  type: typeof FAILED;
  error: string;
}

// A failed pick, and why.
export class FailedGuard implements MessageGuard<FailedMessage> {
  readonly type = FAILED;

  constructor(private readonly maxText: number) {}

  admits(message: unknown): message is FailedMessage {
    return (
      isMessageOf(message, BACKGROUND, this.type) &&
      isShortText(message.error, this.maxText)
    );
  }
}
