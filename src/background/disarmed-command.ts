import { DISARMED, type DisarmedMessage } from "../shared/disarmed-message";
import type { Command, Sender } from "../shared/routing";
import type { DisarmedOutcome } from "./picking";
import { senderTab } from "./sender-tab";

// The page stopped waiting with nothing picked.
export class DisarmedCommand implements Command<DisarmedMessage> {
  readonly type = DISARMED;

  constructor(private readonly outcomes: DisarmedOutcome) {}

  handle(_message: DisarmedMessage, sender: Sender): Promise<void> {
    return this.outcomes.disarmed(senderTab(sender));
  }
}
