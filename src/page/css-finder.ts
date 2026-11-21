import type { PageElement, StyleDeclaration, StyleLook } from "./dom";
import type { ElementStyle } from "./css-reading";
import { URL_SOURCE, type ImageSource } from "./image-source";
import type { CssImages, ImageFinder } from "./locating";

// The pseudo-elements that can paint a picture over their element.
export const BEFORE = "::before";
export const AFTER = "::after";
export type Pseudo = typeof BEFORE | typeof AFTER;

// The property that says whether a pseudo-element is drawn, and the values
// that mean it is not.
const CONTENT = "content";
const NOT_DRAWN: ReadonlySet<string> = new Set(["", "none", "normal"]);

// The element's own style.
export class OwnStyle implements ElementStyle {
  constructor(private readonly look: StyleLook) {}

  of(element: PageElement): StyleDeclaration {
    return this.look(element);
  }
}

// A pseudo-element's style, which only counts when its content is something,
// since otherwise it is not drawn.
export class PseudoStyle implements ElementStyle {
  constructor(
    private readonly look: StyleLook,
    private readonly pseudo: Pseudo,
  ) {}

  of(element: PageElement): StyleDeclaration | undefined {
    const style = this.look(element, this.pseudo);
    return NOT_DRAWN.has(style.getPropertyValue(CONTENT)) ? undefined : style;
  }
}

// A picture a style puts on an element: a background, a mask, content: url(),
// a list marker. Read from the element or one of its pseudo-elements, as the
// style it is given says.
export class CssImageFinder implements ImageFinder {
  constructor(
    private readonly styles: ElementStyle,
    private readonly images: CssImages,
    private readonly property: string,
  ) {}

  find(element: PageElement): ImageSource | undefined {
    const style = this.styles.of(element);
    return style === undefined ? undefined : this.fromStyle(style);
  }

  private fromStyle(style: StyleDeclaration): ImageSource | undefined {
    const url = this.images.first(style.getPropertyValue(this.property));
    return url === undefined ? undefined : { kind: URL_SOURCE, url };
  }
}
