import type { IdleIndicator } from "./pick-indicator";

// The status Chrome gives a tab that has started on a new page.
const LOADING = "loading";

export interface TabChange {
  status?: string | undefined;
}

// A new page in the tab takes the picker with it, so the button goes back to normal.
export class NavigationReset {
  constructor(private readonly indicator: IdleIndicator) {}

  async changed(tabId: number, change: TabChange): Promise<void> {
    if (change.status === LOADING) {
      await this.indicator.showIdle(tabId);
    }
  }
}
