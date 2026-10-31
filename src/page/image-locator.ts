import type { ImageSource, PageElement } from "./dom";
import type { HitSource } from "./point-hits";

// One way an element can show a picture.
export interface ImageFinder {
  find(element: PageElement): ImageSource | undefined;
}

export interface FoundImage {
  element: PageElement;
  source: ImageSource;
}

export interface Locator {
  locate(x: number, y: number): FoundImage | undefined;
}

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
