import { errorMessage } from "../shared/error-message";
import type { ToolbarAction } from "./toolbar-action";

// How Chrome starts its refusal when the tab has gone.
const TAB_CLOSED_PREFIX = "No tab with id";

async function unlessClosed(call: Promise<void>): Promise<void> {
  try {
    await call;
  } catch (error) {
    rethrowUnlessClosed(error);
  }
}

function rethrowUnlessClosed(error: unknown): void {
  if (!errorMessage(error).startsWith(TAB_CLOSED_PREFIX)) {
    throw error;
  }
}

// A tab can close while its button is being updated, and then there is no
// button left to update: that is nothing to report.
export class ClosedTabAction implements ToolbarAction {
  constructor(private readonly action: ToolbarAction) {}

  setBadgeText(details: { tabId: number; text: string }): Promise<void> {
    return unlessClosed(this.action.setBadgeText(details));
  }

  setBadgeBackgroundColor(details: {
    tabId: number;
    color: string;
  }): Promise<void> {
    return unlessClosed(this.action.setBadgeBackgroundColor(details));
  }

  setTitle(details: { tabId: number; title: string }): Promise<void> {
    return unlessClosed(this.action.setTitle(details));
  }
}
