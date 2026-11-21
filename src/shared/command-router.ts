import type { Reply } from "./messages";
import { replyWhenDone } from "./replies";
import type { CommandHandlers, Message, MessageGate, Sender } from "./routing";

// Runs the handler for each message the gate lets in and answers with its
// result. Returns whether it will answer, which is what Chrome's onMessage
// listener has to return to keep the reply channel open.
export class CommandRouter<M extends Message> {
  constructor(
    private readonly gate: MessageGate<M>,
    private readonly handlers: CommandHandlers<M>,
  ) {}

  route(
    message: unknown,
    sender: Sender | undefined,
    reply: (reply: Reply<unknown>) => void,
  ): boolean {
    if (!this.gate.admits(message, sender) || sender === undefined) {
      return false;
    }
    const type: M["type"] = message.type;
    if (!Object.hasOwn(this.handlers, type)) {
      return false;
    }
    const handler = this.handlers[type] as (
      message: M,
      sender: Sender,
    ) => Promise<unknown>;
    replyWhenDone(handler(message, sender), reply);
    return true;
  }
}
