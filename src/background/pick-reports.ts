import type { PickOutcomes } from "./background-commands";
import type { ErrorExplainer } from "./chrome-errors";
import type { ImageDownloader } from "./image-saver";
import type { OutcomeIndicator } from "./pick-indicator";
import type { PickerStop } from "./tab-picker";

// What the page says once the click is in. Every outcome stops the picker in
// the tab's other frames too, since the click was the one it was waiting for.
export class PickReports implements PickOutcomes {
  constructor(
    private readonly picker: PickerStop,
    private readonly saver: ImageDownloader,
    private readonly indicator: OutcomeIndicator,
    private readonly errors: ErrorExplainer,
  ) {}

  async picked(tabId: number, url: string, title: string): Promise<void> {
    await this.picker.disarm(tabId);
    try {
      await this.saver.save(url, title);
      await this.indicator.showIdle(tabId);
    } catch (error) {
      await this.indicator.showError(tabId, this.errors.explain(error));
    }
  }

  async disarmed(tabId: number): Promise<void> {
    await this.picker.disarm(tabId);
    await this.indicator.showIdle(tabId);
  }

  async failed(tabId: number, error: string): Promise<void> {
    await this.picker.disarm(tabId);
    await this.indicator.showError(tabId, error);
  }
}
