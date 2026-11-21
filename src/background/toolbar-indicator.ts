import type { PickIndicator } from "./pick-indicator";
import type { ToolbarAction } from "./toolbar-action";
import {
  ARMED,
  ERROR,
  IDLE,
  type ButtonState,
  type ToolbarLooks,
} from "./toolbar-looks";

// The message that goes with a state that has none.
const NO_MESSAGE = "";

// Each tab has its own picker, so each tab's button has its own look, taken
// from the table it is given.
export class ToolbarIndicator implements PickIndicator {
  constructor(
    private readonly action: ToolbarAction,
    private readonly looks: ToolbarLooks,
  ) {}

  showIdle(tabId: number): Promise<void> {
    return this.show(tabId, IDLE, NO_MESSAGE);
  }

  showArmed(tabId: number): Promise<void> {
    return this.show(tabId, ARMED, NO_MESSAGE);
  }

  showError(tabId: number, message: string): Promise<void> {
    return this.show(tabId, ERROR, message);
  }

  private async show(
    tabId: number,
    state: ButtonState,
    message: string,
  ): Promise<void> {
    const look = this.looks[state](message);
    await Promise.all([
      this.action.setBadgeText({ tabId, text: look.badge }),
      this.action.setBadgeBackgroundColor({ tabId, color: look.colour }),
      this.action.setTitle({ tabId, title: look.title }),
    ]);
  }
}
