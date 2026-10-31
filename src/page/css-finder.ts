import type { ImageSource, PageElement, StyleLook } from "./dom";
import type { CssImages } from "./css-image-urls";
import type { ImageFinder } from "./image-locator";

// A picture a style puts on an element: a background, a mask, content: url(),
// a list marker. With a pseudo-element, that pseudo-element's, which is only
// drawn when its content is something.
export class CssImageFinder implements ImageFinder {
  constructor(
    private readonly look: StyleLook,
    private readonly images: CssImages,
    private readonly property: string,
    private readonly pseudo?: "::before" | "::after",
  ) {}

  find(element: PageElement): ImageSource | undefined {
    const style =
      this.pseudo === undefined
        ? this.look(element)
        : this.look(element, this.pseudo);
    if (
      this.pseudo !== undefined &&
      !this.drawn(style.getPropertyValue("content"))
    ) {
      return undefined;
    }
    const url = this.images.first(style.getPropertyValue(this.property));
    return url === undefined ? undefined : { kind: "url", url };
  }

  private drawn(content: string): boolean {
    return content !== "" && content !== "none" && content !== "normal";
  }
}
