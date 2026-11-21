import { isColourScheme } from "./colour-scheme";
import {
  DISARM,
  DISARMED,
  FAILED,
  SAVE,
  SCHEME,
  type BackgroundMessage,
  type PageMessage,
} from "./messages";
import type { MessageGuard } from "./routing";

type Fields = Record<string, unknown>;

type Background<T extends BackgroundMessage["type"]> = Extract<
  BackgroundMessage,
  { type: T }
>;

// The service worker hands this to chrome.downloads, so only the schemes that
// actually hold an image get through: the web, and bytes the page read itself.
const DOWNLOADABLE = /^(?:https?:|data:image\/)/i;

function isDownloadable(value: unknown): boolean {
  return typeof value === "string" && DOWNLOADABLE.test(value);
}

// A page's title or error is somebody else's text, and no longer than maxText.
function isShortText(value: unknown, maxText: number): boolean {
  return typeof value === "string" && value.length <= maxText;
}

// A disarm carries nothing but its type.
export class DisarmGuard implements MessageGuard<PageMessage, typeof DISARM> {
  readonly type = DISARM;

  admits(_message: unknown): _message is PageMessage {
    return true;
  }
}

// A picked image: an address Chrome may download, and the page's title.
export class SaveGuard implements MessageGuard<BackgroundMessage, typeof SAVE> {
  readonly type = SAVE;

  constructor(private readonly maxText: number) {}

  admits(message: unknown): message is Background<typeof SAVE> {
    const fields = message as Fields;
    return (
      isDownloadable(fields.url) && isShortText(fields.title, this.maxText)
    );
  }
}

// A page that has stopped picking carries nothing but its type.
export class DisarmedGuard implements MessageGuard<
  BackgroundMessage,
  typeof DISARMED
> {
  readonly type = DISARMED;

  admits(_message: unknown): _message is Background<typeof DISARMED> {
    return true;
  }
}

// A failed pick, and why.
export class FailedGuard implements MessageGuard<
  BackgroundMessage,
  typeof FAILED
> {
  readonly type = FAILED;

  constructor(private readonly maxText: number) {}

  admits(message: unknown): message is Background<typeof FAILED> {
    return isShortText((message as Fields).error, this.maxText);
  }
}

// The colour scheme the offscreen document sees.
export class SchemeGuard implements MessageGuard<
  BackgroundMessage,
  typeof SCHEME
> {
  readonly type = SCHEME;

  admits(message: unknown): message is Background<typeof SCHEME> {
    return isColourScheme((message as Fields).scheme);
  }
}
