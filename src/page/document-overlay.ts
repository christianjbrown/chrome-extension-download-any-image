import type { OverlayElement, OverlayHost } from "./outlining";

// The extension's frame is a plain element of its own.
const OVERLAY_TAG = "div";

// The part of a document an overlay is made in and added to, for the kind of
// element it makes.
export interface OverlayDocument<E extends OverlayElement> {
  createElement(tag: typeof OVERLAY_TAG): E;
  readonly documentElement: { append(element: E): void };
}

// The overlay goes on the root element, outside anything the page lays out.
export class DocumentOverlay<E extends OverlayElement> implements OverlayHost {
  constructor(private readonly document: OverlayDocument<E>) {}

  add(ready: (element: OverlayElement) => void): OverlayElement {
    const element = this.document.createElement(OVERLAY_TAG);
    ready(element);
    this.document.documentElement.append(element);
    return element;
  }
}
