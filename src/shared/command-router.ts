import type { Reply } from "./messages";
import { replyWhenDone } from "./replies";
import type { Message, MessageGate, Sender } from "./routing";

// Any one of a context's commands, as the router holds them: each takes only
// its own type of message, which the router looks it up by.
interface RoutedCommand<M extends Message> {
  readonly type: M["type"];
  handle(message: M, sender: Sender): Promise<unknown>;
}

// Runs the command for each message the gate lets in and answers with its
// result. Returns whether it will answer, which is what Chrome's onMessage
// listener has to return to keep the reply channel open.
export class CommandRouter<M extends Message> {
  private readonly byType: ReadonlyMap<string, RoutedCommand<M>>;

  constructor(
    private readonly gate: MessageGate<M>,
    commands: readonly RoutedCommand<M>[],
  ) {
    this.byType = new Map(commands.map((command) => [command.type, command]));
  }

  route(
    message: unknown,
    sender: Sender | undefined,
    reply: (reply: Reply<unknown>) => void,
  ): boolean {
    if (!this.gate.admits(message, sender) || sender === undefined) {
      return false;
    }
    const command = this.byType.get(message.type);
    if (command === undefined) {
      return false;
    }
    replyWhenDone(command.handle(message, sender), reply);
    return true;
  }
}
