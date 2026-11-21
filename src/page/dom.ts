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

export interface StyleDeclaration {
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

// The elements that can show a picture of their own, by local name.
export const TAG = {
  img: "img",
  input: "input",
  video: "video",
  canvas: "canvas",
  svg: "svg",
  svgImage: "image",
} as const;

// The type that makes an <input> a picture button.
export const IMAGE_INPUT_TYPE = "image";

// Something events are heard on, such as the window. A listener is handed
// any event, and checks its shape before it reads more than an event has.
export interface Listenable {
  addEventListener(
    type: string,
    listener: (event: Event) => void,
    options?: { capture: boolean },
  ): void;
  removeEventListener(
    type: string,
    listener: (event: Event) => void,
    options?: { capture: boolean },
  ): void;
}
