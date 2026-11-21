import { isMessageFor } from "./messages";
import type { Message, MessageGate, MessageGuards, Sender } from "./routing";

// Only the extension's own contexts are answered, only with a message for this
// context, and only when its fields are what its type needs.
export class TrustedMessages<M extends Message> implements MessageGate<M> {
  constructor(
    private readonly target: M["target"],
    private readonly guards: MessageGuards<M>,
    private readonly extensionId: string,
  ) {}

  admits(message: unknown, sender: Sender | undefined): message is M {
    if (
      sender?.id !== this.extensionId ||
      !isMessageFor(message, this.target)
    ) {
      return false;
    }
    const type = message.type;
    return (
      typeof type === "string" &&
      Object.hasOwn(this.guards, type) &&
      this.guards[type as M["type"]](message)
    );
  }
}
