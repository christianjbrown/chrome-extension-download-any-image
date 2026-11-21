import { FAILED, type FailedMessage } from "../shared/failed-message";
import type { Command, Sender } from "../shared/routing";
import type { FailedOutcome } from "./picking";
import { senderTab } from "./sender-tab";

// The page could not read the picture.
export class FailedCommand implements Command<FailedMessage> {
  readonly type = FAILED;

  constructor(private readonly outcomes: FailedOutcome) {}

  handle(message: FailedMessage, sender: Sender): Promise<void> {
    return this.outcomes.failed(senderTab(sender), message.error);
  }
}
