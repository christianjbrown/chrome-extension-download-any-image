import {
  URL_SOURCE,
  type ImageSource,
  type PageElement,
  type StyleLook,
} from "./dom";
import type { CssImages } from "./css-image-urls";
import type { ImageFinder } from "./image-locator";

// The pseudo-elements that can paint a picture over their element.
export const BEFORE = "::before";
export const AFTER = "::after";
export type Pseudo = typeof BEFORE | typeof AFTER;

// The property that says whether a pseudo-element is drawn, and the values
// that mean it is not.
const CONTENT = "content";
const NOT_DRAWN: ReadonlySet<string> = new Set(["", "none", "normal"]);

// A picture a style puts on an element: a background, a mask, content: url(),
// a list marker. With a pseudo-element, that pseudo-element's, which is only
// drawn when its content is something.
export class CssImageFinder implements ImageFinder {
  constructor(
    private readonly look: StyleLook,
    private readonly images: CssImages,
    private readonly property: string,
    private readonly pseudo?: Pseudo,
  ) {}

  find(element: PageElement): ImageSource | undefined {
    const style =
      this.pseudo === undefined
        ? this.look(element)
        : this.look(element, this.pseudo);
    if (
      this.pseudo !== undefined &&
      !this.drawn(style.getPropertyValue(CONTENT))
    ) {
      return undefined;
    }
    const url = this.images.first(style.getPropertyValue(this.property));
    return url === undefined ? undefined : { kind: URL_SOURCE, url };
  }

  private drawn(content: string): boolean {
    return !NOT_DRAWN.has(content);
  }
}
