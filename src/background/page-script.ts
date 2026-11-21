import {
  DISARM_MESSAGE,
  isOkReply,
  type PageMessage,
} from "../shared/messages";
import type { PickerScript } from "./picking";

export interface ScriptingApi {
  executeScript(injection: {
    target: { tabId: number; allFrames: true };
    files: string[];
  }): Promise<unknown>;
}

export interface TabMessagingApi {
  // The page's answer to a disarm, which is checked before it is believed:
  // a frame that heard it may give none, or anything at all.
  sendMessage(tabId: number, message: PageMessage): Promise<unknown>;
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
    return this.tabs.sendMessage(tabId, DISARM_MESSAGE).then(
      (reply) => isOkReply(reply),
      () => false,
    );
  }
}
