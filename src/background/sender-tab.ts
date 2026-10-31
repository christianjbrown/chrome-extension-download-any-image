import type { Sender } from "../shared/command-router";

// The tab a page script wrote from. Chrome always says, for a frame in a tab.
export function senderTab(sender: Sender): number {
  const tabId = sender.tab?.id;
  if (tabId === undefined) {
    throw new Error("Only a page in a tab can pick an image");
  }
  return tabId;
}
