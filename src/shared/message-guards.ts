import { isColourScheme } from "./colour-scheme";
import type {
  BackgroundMessage,
  DISARMED,
  FAILED,
  PageMessage,
  SAVE,
  SCHEME,
} from "./messages";

type Fields = Record<string, unknown>;

type Background<T extends BackgroundMessage["type"]> = Extract<
  BackgroundMessage,
  { type: T }
>;

// Whether a message that names a type also carries the fields that type needs.
export type MessageGuards<M extends { type: string }> = {
  [T in M["type"]]: (message: unknown) => message is Extract<M, { type: T }>;
};

// The service worker hands this to chrome.downloads, so only the schemes that
// actually hold an image get through: the web, and bytes the page read itself.
const DOWNLOADABLE = /^(?:https?:|data:image\/)/i;

export const pageGuards: MessageGuards<PageMessage> = {
  disarm: (_message): _message is PageMessage => true,
};

// A page's title or error is somebody else's text, and no longer than maxText.
export function backgroundGuards(
  maxText: number,
): MessageGuards<BackgroundMessage> {
  const isShortText = (value: unknown): boolean =>
    typeof value === "string" && value.length <= maxText;
  return {
    save: (message): message is Background<typeof SAVE> => {
      const fields = message as Fields;
      return (
        typeof fields.url === "string" &&
        DOWNLOADABLE.test(fields.url) &&
        isShortText(fields.title)
      );
    },
    disarmed: (_message): _message is Background<typeof DISARMED> => true,
    failed: (message): message is Background<typeof FAILED> =>
      isShortText((message as Fields).error),
    scheme: (message): message is Background<typeof SCHEME> =>
      isColourScheme((message as Fields).scheme),
  };
}
