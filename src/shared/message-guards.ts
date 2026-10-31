import type { BackgroundMessage, PageMessage } from "./messages";

type Fields = Record<string, unknown>;

// Whether a message that names a type also carries the fields that type needs.
export type MessageGuards<M extends { type: string }> = {
  [T in M["type"]]: (message: unknown) => message is Extract<M, { type: T }>;
};

// The service worker hands this to chrome.downloads, so only the schemes that
// actually hold an image get through: the web, and bytes the page read itself.
const DOWNLOADABLE = /^(?:https?:|data:image\/)/i;
const MAX_TEXT = 2000;

const isShortText = (value: unknown): boolean =>
  typeof value === "string" && value.length <= MAX_TEXT;

export const pageGuards: MessageGuards<PageMessage> = {
  disarm: (_message): _message is PageMessage => true,
};

export const backgroundGuards: MessageGuards<BackgroundMessage> = {
  save: (message): message is Extract<BackgroundMessage, { type: "save" }> => {
    const fields = message as Fields;
    return (
      typeof fields.url === "string" &&
      DOWNLOADABLE.test(fields.url) &&
      isShortText(fields.title)
    );
  },
  disarmed: (
    _message,
  ): _message is Extract<BackgroundMessage, { type: "disarmed" }> => true,
  failed: (
    message,
  ): message is Extract<BackgroundMessage, { type: "failed" }> =>
    isShortText((message as Fields).error),
};
