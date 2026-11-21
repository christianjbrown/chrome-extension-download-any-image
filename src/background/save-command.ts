import type { Command, Sender } from "../shared/routing";
import { SAVE, type SaveMessage } from "../shared/save-message";
import type { PickedOutcome, SenderTabs } from "./picking";

// The page picked an image, to be saved from the tab it came from.
export class SaveCommand implements Command<SaveMessage> {
  readonly type = SAVE;

  constructor(
    private readonly outcomes: PickedOutcome,
    private readonly tabs: SenderTabs,
  ) {}

  handle(message: SaveMessage, sender: Sender): Promise<void> {
    return this.outcomes.picked(
      this.tabs.tabOf(sender),
      message.url,
      message.title,
    );
  }
}
