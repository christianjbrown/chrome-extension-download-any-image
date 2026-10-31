import type { PageMessage } from "../shared/messages";

export interface ScriptingApi {
  executeScript(injection: {
    target: { tabId: number; allFrames: true };
    files: string[];
  }): Promise<unknown>;
}

export interface TabMessagingApi {
  sendMessage(tabId: number, message: PageMessage): Promise<unknown>;
}

// The script that waits in the page for the click.
export interface PickerScript {
  inject(tabId: number): Promise<void>;
  // Whether any frame in the tab was still waiting.
  disarm(tabId: number): Promise<boolean>;
}

export class PageScript implements PickerScript {
  constructor(
    private readonly scripting: ScriptingApi,
    private readonly tabs: TabMessagingApi,
    private readonly file: string,
  ) {}

  // Every frame Chrome lets the extension into, so an image in an embed can be
  // picked too. Chrome leaves out the frames it does not.
  async inject(tabId: number): Promise<void> {
    await this.scripting.executeScript({
      target: { tabId, allFrames: true },
      files: [this.file],
    });
  }

  // A disarmed frame stops listening, so when no frame is armed nobody is there
  // to answer and Chrome rejects the message.
  disarm(tabId: number): Promise<boolean> {
    return this.tabs
      .sendMessage(tabId, { target: "page", type: "disarm" })
      .then(
        (reply) => (reply as { ok?: unknown } | undefined)?.ok === true,
        () => false,
      );
  }
}
