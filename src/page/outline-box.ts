import { PICKER_BLUE } from "../shared/brand-colours";
import type { Box } from "./dom";

export interface OverlayElement {
  readonly style: { setProperty(name: string, value: string): void };
  remove(): void;
}

export interface Outline {
  show(box: Box): void;
  hide(): void;
}

// The largest z-index there is, so the frame sits over anything the page draws.
const TOPMOST = "2147483647";

const LOOK: readonly (readonly [string, string])[] = [
  ["position", "fixed"],
  ["z-index", TOPMOST],
  ["pointer-events", "none"],
  ["box-sizing", "border-box"],
  ["border", `3px solid ${PICKER_BLUE}`],
  ["border-radius", "2px"],
  ["box-shadow", "0 0 0 1px #ffffff, inset 0 0 0 1px #ffffff"],
  ["margin", "0"],
  ["padding", "0"],
];

// Where the frame goes, each one a CSS property named as the box's field is.
const PLACEMENT = ["left", "top", "width", "height"] as const;

const pixels = (length: number): string => `${String(length)}px`;

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
    for (const side of PLACEMENT) {
      element.style.setProperty(side, pixels(box[side]));
    }
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
