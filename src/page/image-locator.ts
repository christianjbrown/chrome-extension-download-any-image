import type { ImageSource, PageElement } from "./dom";
import type { FoundImage, HitSource, ImageFinder, Locator } from "./locating";

// The topmost picture under the point: each element from the top down, asking
// every finder in turn.
export class ImageLocator implements Locator {
  constructor(
    private readonly hits: HitSource,
    private readonly finders: readonly ImageFinder[],
  ) {}

  locate(x: number, y: number): FoundImage | undefined {
    for (const element of this.hits.at(x, y)) {
      const source = this.sourceOf(element);
      if (source !== undefined) {
        return { element, source };
      }
    }
    return undefined;
  }

  private sourceOf(element: PageElement): ImageSource | undefined {
    for (const finder of this.finders) {
      const source = finder.find(element);
      if (source !== undefined) {
        return source;
      }
    }
    return undefined;
  }
}
