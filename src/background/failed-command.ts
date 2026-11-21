import { FAILED, type FailedMessage } from "../shared/failed-message";
import type { Command, Sender } from "../shared/routing";
import type { FailedOutcome, SenderTabs } from "./picking";

// The page could not read the picture.
export class FailedCommand implements Command<FailedMessage> {
  readonly type = FAILED;

  constructor(
    private readonly outcomes: FailedOutcome,
    private readonly tabs: SenderTabs,
  ) {}

  handle(message: FailedMessage, sender: Sender): Promise<void> {
    return this.outcomes.failed(this.tabs.tabOf(sender), message.error);
  }
}
