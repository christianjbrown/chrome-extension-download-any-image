// The checks every message guard makes before it reads a message's own fields.
import { isObject } from "./objects";

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

// A page's title or error is somebody else's text, and no longer than maxText.
export function isShortText(value: unknown, maxText: number): boolean {
  return typeof value === "string" && value.length <= maxText;
}
