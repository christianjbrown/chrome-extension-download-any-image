import type { Sender } from "../shared/routing";
import type { SenderTabs } from "./picking";

const NOT_IN_A_TAB = "Only a page in a tab can pick an image";

const tabIdOf = (sender: Sender): number | undefined => sender.tab?.id;

// The tab a page script wrote from. Chrome always says, for a frame in a tab,
// and a message from anywhere else is refused.
export class TabOfSender implements SenderTabs {
  tabOf(sender: Sender): number {
    const tabId = tabIdOf(sender);
    if (tabId === undefined) {
      throw new Error(NOT_IN_A_TAB);
    }
    return tabId;
  }
}
