// The page script's few direct dealings with the document, each behind the
// interface the part that needs it asks for.
import type { PageElement, SvgLike } from "./dom";
import type { SvgSerializer } from "./image-readers";
import type { OverlayElement, OverlayHost } from "./outline-box";
import type { Backdrop } from "./point-hits";

// The extension's frame is a plain element of its own.
const OVERLAY_TAG = "div";

// The part of a document the page's backdrop is.
export interface BackdropDocument {
  readonly documentElement: unknown;
  readonly body: unknown;
}

// The page's own root and body, which sit under everything.
export class DocumentBackdrop implements Backdrop {
  constructor(private readonly document: BackdropDocument) {}

  isBackdrop(element: PageElement): boolean {
    return (
      element === this.document.documentElement ||
      element === this.document.body
    );
  }
}

// The part of a document an overlay is made in and added to.
export interface OverlayDocument {
  createElement(tag: typeof OVERLAY_TAG): OverlayElement;
  readonly documentElement: { append(element: OverlayElement): void };
}

// The overlay goes on the root element, outside anything the page lays out.
export class DocumentOverlay implements OverlayHost {
  constructor(private readonly document: OverlayDocument) {}

  create(): OverlayElement {
    return this.document.createElement(OVERLAY_TAG);
  }

  attach(element: OverlayElement): void {
    this.document.documentElement.append(element);
  }
}

// The part of an XMLSerializer this needs.
export interface MarkupWriter {
  serializeToString(svg: SvgLike): string;
}

// A fresh writer for each picture, made only once there is one to write.
export class XmlSvgSerializer implements SvgSerializer {
  constructor(private readonly newWriter: () => MarkupWriter) {}

  serialize(svg: SvgLike): string {
    return this.newWriter().serializeToString(svg);
  }
}
