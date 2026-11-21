import { isMessageFor } from "./messages";
import type { Message, MessageGate, MessageGuard, Sender } from "./routing";

// Only the extension's own contexts are answered, only with a message for this
// context, and only when the guard for its type says its fields are right.
export class TrustedMessages<M extends Message> implements MessageGate<M> {
  private readonly byType: ReadonlyMap<string, MessageGuard<M>>;

  constructor(
    private readonly target: M["target"],
    guards: readonly MessageGuard<M>[],
    private readonly extensionId: string,
  ) {
    this.byType = new Map(guards.map((guard) => [guard.type, guard]));
  }

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
      this.byType.get(type)?.admits(message) === true
    );
  }
}
