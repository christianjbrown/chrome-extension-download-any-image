// A page picked an image, for the service worker to save.
import { isMessageOf, isShortText } from "./message-checks";
import { BACKGROUND } from "./message-targets";
import type { MessageGuard } from "./routing";

export const SAVE = "save";

export interface SaveMessage {
  target: typeof BACKGROUND;
  type: typeof SAVE;
  url: string;
  title: string;
}

// The service worker hands this to chrome.downloads, so only the schemes that
// actually hold an image get through: the web, and bytes the page read itself.
const DOWNLOADABLE = /^(?:https?:|data:image\/)/i;

function isDownloadable(value: unknown): boolean {
  return typeof value === "string" && DOWNLOADABLE.test(value);
}

// A picked image: an address Chrome may download, and the page's title.
export class SaveGuard implements MessageGuard<SaveMessage> {
  readonly type = SAVE;

  constructor(private readonly maxText: number) {}

  admits(message: unknown): message is SaveMessage {
    return (
      isMessageOf(message, BACKGROUND, this.type) && this.fieldsRight(message)
    );
  }

  private fieldsRight({ url, title }: Record<string, unknown>): boolean {
    return isDownloadable(url) && isShortText(title, this.maxText);
  }
}
