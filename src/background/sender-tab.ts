import type { Sender } from "../shared/command-router";

const NOT_IN_A_TAB = "Only a page in a tab can pick an image";

// The tab a page script wrote from. Chrome always says, for a frame in a tab.
export function senderTab(sender: Sender): number {
  const tabId = sender.tab?.id;
  if (tabId === undefined) {
    throw new Error(NOT_IN_A_TAB);
  }
  return tabId;
}
