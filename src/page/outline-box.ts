import type { Box } from "./dom";

export interface OverlayElement {
  readonly style: { setProperty(name: string, value: string): void };
  remove(): void;
}

export interface Outline {
  show(box: Box): void;
  hide(): void;
}

const LOOK: readonly (readonly [string, string])[] = [
  ["position", "fixed"],
  ["z-index", "2147483647"],
  ["pointer-events", "none"],
  ["box-sizing", "border-box"],
  ["border", "3px solid #1a73e8"],
  ["border-radius", "2px"],
  ["box-shadow", "0 0 0 1px #ffffff, inset 0 0 0 1px #ffffff"],
  ["margin", "0"],
  ["padding", "0"],
];

// A frame drawn over the picture that would be picked. It is the extension's
// own element, so nothing on the page is restyled, and it ignores the pointer,
// so it is never what gets picked. Styled through the CSSOM, which a page's
// content security policy does not block.
export class OutlineBox implements Outline {
  private element: OverlayElement | undefined;

  constructor(
    private readonly create: () => OverlayElement,
    private readonly attach: (element: OverlayElement) => void,
  ) {}

  show(box: Box): void {
    const element = this.element ?? this.added();
    element.style.setProperty("left", `${String(box.left)}px`);
    element.style.setProperty("top", `${String(box.top)}px`);
    element.style.setProperty("width", `${String(box.width)}px`);
    element.style.setProperty("height", `${String(box.height)}px`);
  }

  hide(): void {
    this.element?.remove();
    this.element = undefined;
  }

  private added(): OverlayElement {
    const element = this.create();
    LOOK.forEach(([name, value]) => {
      element.style.setProperty(name, value);
    });
    this.attach(element);
    this.element = element;
    return element;
  }
}
