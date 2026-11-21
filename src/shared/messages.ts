// Everything the service worker, the page script and the offscreen document
// say to each other. Each message is declared in a module of its own, with
// its guard, and a new one is one more line in its union here.
import type { DisarmMessage } from "./disarm-message";
import type { DisarmedMessage } from "./disarmed-message";
import type { FailedMessage } from "./failed-message";
import type { SaveMessage } from "./save-message";
import type { SchemeMessage } from "./scheme-message";

// What the page script is asked to do.
export type PageMessage = DisarmMessage;

// What the service worker is told.
export type BackgroundMessage =
  SaveMessage | DisarmedMessage | FailedMessage | SchemeMessage;

// The part of chrome.runtime that sends to the service worker.
export interface BackgroundMessenger {
  sendMessage(message: BackgroundMessage): Promise<unknown>;
}
