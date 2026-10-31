import { SVG_NAMESPACE, type Box, type PageElement } from "../../src/page/dom";

// An element in name only, with whatever extra fields a test gives it.
export function element(
  localName: string,
  extra: Record<string, unknown> = {},
  box: Box = { left: 0, top: 0, width: 10, height: 10 },
): PageElement & Record<string, unknown> {
  return {
    localName,
    namespaceURI: "http://www.w3.org/1999/xhtml",
    shadowRoot: null,
    getBoundingClientRect: () => box,
    getRootNode: () => undefined,
    ...extra,
  };
}

export function svgElement(
  localName: string,
  extra: Record<string, unknown> = {},
): PageElement & Record<string, unknown> {
  return element(localName, { namespaceURI: SVG_NAMESPACE, ...extra });
}

// What getComputedStyle would say, per pseudo-element ("" for the element itself).
export function styles(byPseudo: Record<string, Record<string, string>>): (
  element: PageElement,
  pseudo?: string,
) => {
  getPropertyValue(property: string): string;
} {
  return (_element, pseudo) => ({
    getPropertyValue: (property) => byPseudo[pseudo ?? ""]?.[property] ?? "",
  });
}

type Listener = (event: never) => void;

export interface FakeTarget {
  listeners: Map<string, Set<Listener>>;
  addEventListener(type: string, listener: Listener): void;
  removeEventListener(type: string, listener: Listener): void;
  fire(type: string, event?: unknown): void;
  count(): number;
}

// An event target that remembers its listeners, so a test can fire events
// and count what is left.
export function target(): FakeTarget {
  const listeners = new Map<string, Set<Listener>>();
  return {
    listeners,
    addEventListener: (type: string, listener: Listener) => {
      listeners.set(type, (listeners.get(type) ?? new Set()).add(listener));
    },
    removeEventListener: (type: string, listener: Listener) => {
      listeners.get(type)?.delete(listener);
    },
    fire(type: string, event: unknown = {}) {
      [...(listeners.get(type) ?? [])].forEach((listener) => {
        listener(event as never);
      });
    },
    count: () =>
      [...listeners.values()].reduce((sum, set) => sum + set.size, 0),
  };
}
