import type { PageElement, PointQueryable } from "./dom";

// Elements under a point, topmost first.
export interface HitSource {
  at(x: number, y: number): PageElement[];
}

// Everything the browser says is under the point, overlays and ancestors
// included, with the insides of open shadow roots ahead of their hosts. The
// page's own backdrop is left out, so a click on plain text does not pick the
// wallpaper.
export class StackHits implements HitSource {
  constructor(
    private readonly root: PointQueryable,
    private readonly isBackdrop: (element: PageElement) => boolean,
  ) {}

  at(x: number, y: number): PageElement[] {
    const found: PageElement[] = [];
    this.collect(this.root.elementsFromPoint(x, y), { x, y }, found);
    return found.filter((element) => !this.isBackdrop(element));
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

const MEDIA = "img, svg, canvas, video, input[type=image]";

// Pictures with pointer-events: none never show up in the stack, so these are
// found by where they are. Later in the page is usually painted on top.
export class MediaHits implements HitSource {
  constructor(private readonly document: MediaQueryable) {}

  at(x: number, y: number): PageElement[] {
    return Array.from(this.document.querySelectorAll(MEDIA))
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
