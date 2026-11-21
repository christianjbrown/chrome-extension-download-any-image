import { firstDefined } from "../shared/defined";
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
    return firstDefined(this.hits.at(x, y), (element) => this.foundIn(element));
  }

  private foundIn(element: PageElement): FoundImage | undefined {
    const source = this.sourceOf(element);
    return source === undefined ? undefined : { element, source };
  }

  private sourceOf(element: PageElement): ImageSource | undefined {
    return firstDefined(this.finders, (finder) => finder.find(element));
  }
}
