// Everything the service worker, the page script and the offscreen document
// say to each other.
import type { ColourScheme } from "./colour-scheme";

// Who a message is for. Every context hears every message.
export const PAGE = "page";
export const BACKGROUND = "background";

// What the page script is asked to do.
const DISARM = "disarm";

// What the service worker is told.
export const SAVE = "save";
export const DISARMED = "disarmed";
export const FAILED = "failed";
export const SCHEME = "scheme";

export interface PageMessage {
  target: typeof PAGE;
  type: typeof DISARM;
}

// The one thing the page script is ever asked.
export const DISARM_MESSAGE: PageMessage = { target: PAGE, type: DISARM };

export type BackgroundMessage =
  | { target: typeof BACKGROUND; type: typeof SAVE; url: string; title: string }
  | { target: typeof BACKGROUND; type: typeof DISARMED }
  | { target: typeof BACKGROUND; type: typeof FAILED; error: string }
  | { target: typeof BACKGROUND; type: typeof SCHEME; scheme: ColourScheme };

// The part of chrome.runtime that sends to the service worker.
export interface BackgroundMessenger {
  sendMessage(message: BackgroundMessage): Promise<unknown>;
}

export type Reply<T> = { ok: true; value: T } | { ok: false; error: string };

// Every runtime message reaches every context, so each one picks out its own.
export function isMessageFor(
  message: unknown,
  target: string,
): message is { target: string; type: string } {
  return (
    typeof message === "object" &&
    message !== null &&
    (message as { target?: unknown }).target === target
  );
}
