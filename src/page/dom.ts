// The little of the DOM the page script uses, so each piece can be tested
// without a browser.

export interface Box {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface PointQueryable {
  elementsFromPoint(x: number, y: number): PageElement[];
}

export interface PageElement {
  readonly localName: string;
  readonly namespaceURI: string | null;
  readonly shadowRoot?: (PointQueryable & object) | null;
  getBoundingClientRect(): Box;
  getRootNode(): unknown;
}

interface StyleDeclaration {
  getPropertyValue(property: string): string;
}

// getComputedStyle, for the element itself or one of its pseudo-elements.
export type StyleLook = (
  element: PageElement,
  pseudo?: string,
) => StyleDeclaration;

export const SVG_NAMESPACE = "http://www.w3.org/2000/svg";

// Something whose image can be read off it in the page.
export interface CanvasLike {
  toDataURL(type: string): string;
}

export interface SvgLike extends PageElement {
  cloneNode(deep: true): SvgLike;
  hasAttribute(name: string): boolean;
  setAttribute(name: string, value: string): void;
  readonly style: { setProperty(name: string, value: string): void };
}

export type ImageSource =
  | { kind: "url"; url: string }
  | { kind: "canvas"; canvas: CanvasLike }
  | { kind: "svg"; svg: SvgLike };

export interface Listenable {
  addEventListener(
    type: string,
    listener: (event: never) => void,
    options?: { capture: boolean },
  ): void;
  removeEventListener(
    type: string,
    listener: (event: never) => void,
    options?: { capture: boolean },
  ): void;
}
