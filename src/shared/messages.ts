// Everything the service worker and the page script say to each other.

export interface PageMessage {
  target: "page";
  type: "disarm";
}

export type BackgroundMessage =
  | { target: "background"; type: "save"; url: string; title: string }
  | { target: "background"; type: "disarmed" }
  | { target: "background"; type: "failed"; error: string };

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
