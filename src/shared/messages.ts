// Everything the service worker, the page script and the offscreen document
// say to each other.
import type { ColourScheme } from "./colour-scheme";
import { isObject } from "./objects";

// Who a message is for. Every context hears every message.
export const PAGE = "page";
export const BACKGROUND = "background";

// What the page script is asked to do.
export const DISARM = "disarm";

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

// Whether an answer from another context is a reply saying its work went
// through. Anything else, a failure or no answer at all, is not.
export function isOkReply(reply: unknown): boolean {
  return isObject(reply) && reply.ok === true;
}

// Every runtime message reaches every context, so each one picks out its own.
export function isMessageFor(
  message: unknown,
  target: string,
): message is { target: string; type: string } {
  return isObject(message) && message.target === target;
}

// Whether a value from another context is a message for the target, of the
// one type, so a guard can go on to read that type's own fields.
export function isMessageOf(
  message: unknown,
  target: string,
  type: string,
): message is Record<string, unknown> {
  return isMessageFor(message, target) && message.type === type;
}
