import type { ErrorExplainer } from "./chrome-errors";
import type { PickIndicator } from "./pick-indicator";
import type { Picker } from "./tab-picker";

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
    const tabId = tab.id;
    // A click while the last one is still arming does nothing.
    if (tabId === undefined || this.busy.has(tabId)) {
      return;
    }
    this.busy.add(tabId);
    try {
      await this.flip(tabId);
    } catch (error) {
      await this.picker.disarm(tabId);
      await this.indicator.showError(tabId, this.errors.explain(error));
    } finally {
      this.busy.delete(tabId);
    }
  }

  // Asking the page, rather than remembering, survives the service worker being
  // shut down in between, and a page that disarmed itself.
  private async flip(tabId: number): Promise<void> {
    if (await this.picker.disarm(tabId)) {
      await this.indicator.showIdle(tabId);
      return;
    }
    await this.picker.arm(tabId);
    await this.indicator.showArmed(tabId);
  }
}
