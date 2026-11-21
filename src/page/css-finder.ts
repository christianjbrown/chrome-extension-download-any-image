import type { PageElement, StyleDeclaration } from "./dom";
import type { ElementStyle } from "./css-reading";
import type { ImageSource } from "./image-source";
import { URL_SOURCE } from "./url-source";
import type { CssImages, ImageFinder } from "./locating";

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
