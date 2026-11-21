// The page script's few direct dealings with the document, each behind the
// interface the part that needs it asks for.
import type { PageElement, StyleDeclaration, SvgLike } from "./dom";
import type { SvgSerializer } from "./image-reading";
import type { Backdrop } from "./locating";
import type { OverlayElement, OverlayHost } from "./outlining";

// The extension's frame is a plain element of its own.
const OVERLAY_TAG = "div";

// What the person is told if the page hands over something that only looks
// like an element.
const NOT_AN_ELEMENT = "That is not an element on the page";

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

// The browser's own element behind a page port, for the browser functions that
// take nothing less.
export interface ElementSource {
  element<T extends object>(value: T): T & Element;
}

// Checks a port really is one of the browser's elements, and refuses anything
// else the way the browser's own functions would.
export class ElementCheck implements ElementSource {
  constructor(
    private readonly isElement: (value: unknown) => value is Element,
  ) {}

  element<T extends object>(value: T): T & Element {
    if (!this.isElement(value)) {
      throw new TypeError(NOT_AN_ELEMENT);
    }
    return value;
  }
}

// getComputedStyle, for an element of the page or one of its pseudo-elements.
export type ComputedStyle = (
  element: Element,
  pseudo?: string,
) => StyleDeclaration;

// The style the browser computed for an element the page script found.
export class ElementStyles {
  constructor(
    private readonly elements: ElementSource,
    private readonly computed: ComputedStyle,
  ) {}

  look(element: PageElement, pseudo?: string): StyleDeclaration {
    return this.computed(this.elements.element(element), pseudo);
  }
}

// The part of an XMLSerializer this needs.
export interface MarkupWriter {
  serializeToString(node: Element): string;
}

// A fresh writer for each picture, made only once there is one to write.
export class XmlSvgSerializer implements SvgSerializer {
  constructor(
    private readonly newWriter: () => MarkupWriter,
    private readonly elements: ElementSource,
  ) {}

  serialize(svg: SvgLike): string {
    return this.newWriter().serializeToString(this.elements.element(svg));
  }
}
