import type { PageElement, PointQueryable } from "./dom";
import type { Backdrop, HitSource, PlacedKind } from "./locating";

// Everything the browser says is under the point, overlays and ancestors
// included, with the insides of open shadow roots ahead of their hosts. The
// page's own backdrop is left out, so a click on plain text does not pick the
// wallpaper.
export class StackHits implements HitSource {
  constructor(
    private readonly root: PointQueryable,
    private readonly backdrop: Backdrop,
  ) {}

  at(x: number, y: number): PageElement[] {
    const found: PageElement[] = [];
    this.collect(this.root.elementsFromPoint(x, y), { x, y }, found);
    return found.filter((element) => !this.backdrop.isBackdrop(element));
  }

  private collect(
    elements: PageElement[],
    point: { x: number; y: number },
    found: PageElement[],
  ): void {
    for (const element of elements) {
      const shadow = element.shadowRoot;
      if (shadow) {
        const inside = shadow
          .elementsFromPoint(point.x, point.y)
          .filter((inner) => inner.getRootNode() === shadow);
        this.collect(inside, point, found);
      }
      found.push(element);
    }
  }
}

export interface MediaQueryable {
  querySelectorAll(selectors: string): Iterable<PageElement>;
}

const SELECTOR_LIST = ", ";

// Pictures with pointer-events: none never show up in the stack, so these are
// found by where they are, for each kind the finders can place. Later in the
// page is usually painted on top.
export class MediaHits implements HitSource {
  private readonly media: string;

  constructor(
    private readonly document: MediaQueryable,
    kinds: readonly PlacedKind[],
  ) {
    this.media = kinds.map((kind) => kind.selector).join(SELECTOR_LIST);
  }

  at(x: number, y: number): PageElement[] {
    return Array.from(this.document.querySelectorAll(this.media))
      .filter((element) => {
        const box = element.getBoundingClientRect();
        return (
          x >= box.left &&
          x < box.left + box.width &&
          y >= box.top &&
          y < box.top + box.height
        );
      })
      .reverse();
  }
}

// Every source's hits, in order, each element once.
export class PointHits implements HitSource {
  constructor(private readonly sources: readonly HitSource[]) {}

  at(x: number, y: number): PageElement[] {
    return [...new Set(this.sources.flatMap((source) => source.at(x, y)))];
  }
}
