import type { Cursor, Picker, PickerScript } from "./picking";

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
