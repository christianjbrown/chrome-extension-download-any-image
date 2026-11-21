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
    return this.fromExtension(sender) && this.forThisContext(message);
  }

  private fromExtension(sender: Sender | undefined): boolean {
    return sender?.id === this.extensionId;
  }

  private forThisContext(message: unknown): message is M {
    return isMessageFor(message, this.target) && this.fieldsRight(message);
  }

  private fieldsRight(message: { type: unknown }): message is M {
    return (
      typeof message.type === "string" &&
      this.guardAdmits(message.type, message)
    );
  }

  // A type with no guard is not one this context knows.
  private guardAdmits(type: string, message: unknown): message is M {
    return this.byType.get(type)?.admits(message) === true;
  }
}
