import type { Reply } from "./messages";
import { replyWhenDone } from "./replies";
import type { Message, MessageGate, Sender } from "./routing";

// Sends the command's result back to whoever wrote.
type Answer = (reply: Reply<unknown>) => void;

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

  route(message: unknown, sender: Sender | undefined, reply: Answer): boolean {
    return (
      this.gate.admits(message, sender) &&
      this.fromSender(message, sender, reply)
    );
  }

  private fromSender(
    message: M,
    sender: Sender | undefined,
    reply: Answer,
  ): boolean {
    return sender !== undefined && this.dispatch(message, sender, reply);
  }

  private dispatch(message: M, sender: Sender, reply: Answer): boolean {
    const command = this.byType.get(message.type);
    return command !== undefined && this.run(command, message, sender, reply);
  }

  private run(
    command: RoutedCommand<M>,
    message: M,
    sender: Sender,
    reply: Answer,
  ): true {
    replyWhenDone(command.handle(message, sender), reply);
    return true;
  }
}
