import { ARMED_STATE, ERROR, IDLE_STATE } from "./button-states";
import type { PickIndicator } from "./pick-indicator";
import type { ErrorExplainer, Picker } from "./picking";

export interface ClickedTab {
  id?: number | undefined;
}

// A click on the toolbar button: arm the picker, or stop it if it is armed.
export class ToggleController {
  private readonly busy = new Set<number>();

  constructor(
    private readonly picker: Picker,
    private readonly indicator: PickIndicator,
    private readonly errors: ErrorExplainer,
  ) {}

  async toggle(tab: ClickedTab): Promise<void> {
    if (tab.id !== undefined) {
      await this.toggleTab(tab.id);
    }
  }

  // A click while the last one is still arming does nothing.
  private async toggleTab(tabId: number): Promise<void> {
    if (!this.busy.has(tabId)) {
      await this.flipOnce(tabId);
    }
  }

  private async flipOnce(tabId: number): Promise<void> {
    this.busy.add(tabId);
    try {
      await this.flip(tabId);
    } catch (error) {
      await this.picker.disarm(tabId);
      await this.indicator.show(tabId, {
        kind: ERROR,
        reason: this.errors.explain(error),
      });
    } finally {
      this.busy.delete(tabId);
    }
  }

  // Asking the page, rather than remembering, survives the service worker being
  // shut down in between, and a page that disarmed itself.
  private async flip(tabId: number): Promise<void> {
    if (await this.picker.disarm(tabId)) {
      await this.indicator.show(tabId, IDLE_STATE);
      return;
    }
    await this.picker.arm(tabId);
    await this.indicator.show(tabId, ARMED_STATE);
  }
}
