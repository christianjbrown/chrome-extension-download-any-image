import type { SchemeReader, TabSchemeSink } from "./scheme-ports";

// A click on the button lets the extension into that tab, which is the one
// chance to see the colour scheme Chrome itself is in.
export class ClickScheme {
  constructor(
    private readonly reader: SchemeReader,
    private readonly sink: TabSchemeSink,
  ) {}

  async clicked(tab: { id?: number | undefined }): Promise<void> {
    if (tab.id !== undefined) {
      await this.readTab(tab.id);
    }
  }

  private async readTab(tabId: number): Promise<void> {
    const scheme = await this.reader.read(tabId);
    if (scheme !== undefined) {
      await this.sink.tabShows(scheme);
    }
  }
}
