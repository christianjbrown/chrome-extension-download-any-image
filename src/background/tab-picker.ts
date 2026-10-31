import type { Cursor } from "./cursor-style";
import type { PickerScript } from "./page-script";

// Waiting for the click in one tab, and stopping again.
export interface Picker {
  arm(tabId: number): Promise<void>;
  // Whether it was waiting. Never fails: there is always a way to stop.
  disarm(tabId: number): Promise<boolean>;
}

export class TabPicker implements Picker {
  constructor(
    private readonly script: PickerScript,
    private readonly cursor: Cursor,
  ) {}

  // The script first, since a tab Chrome keeps the extension out of refuses it,
  // and then there is no crosshair to take away again.
  async arm(tabId: number): Promise<void> {
    await this.script.inject(tabId);
    await this.cursor.show(tabId);
  }

  async disarm(tabId: number): Promise<boolean> {
    const wasArmed = await this.script.disarm(tabId);
    await this.cursor.hide(tabId).catch(() => undefined);
    return wasArmed;
  }
}
