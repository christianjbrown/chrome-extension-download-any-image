import { DISARMED, type DisarmedMessage } from "../shared/disarmed-message";
import type { Command, Sender } from "../shared/routing";
import type { DisarmedOutcome, SenderTabs } from "./picking";

// The page stopped waiting with nothing picked.
export class DisarmedCommand implements Command<DisarmedMessage> {
  readonly type = DISARMED;

  constructor(
    private readonly outcomes: DisarmedOutcome,
    private readonly tabs: SenderTabs,
  ) {}

  handle(_message: DisarmedMessage, sender: Sender): Promise<void> {
    return this.outcomes.disarmed(this.tabs.tabOf(sender));
  }
}
