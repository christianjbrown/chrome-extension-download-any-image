import type { Box, PageElement, PointQueryable } from "./dom";
import type { Backdrop, HitSource, PlacedKind } from "./locating";

interface Point {
  x: number;
  y: number;
}

type Shadow = NonNullable<PageElement["shadowRoot"]>;

// What the shadow root itself holds under the point, not what lies outside it.
const insideShadow = (shadow: Shadow, point: Point): PageElement[] =>
  shadow
    .elementsFromPoint(point.x, point.y)
    .filter((inner) => inner.getRootNode() === shadow);

const spans = (start: number, length: number, at: number): boolean =>
  at >= start && at < start + length;

const covers = (box: Box, x: number, y: number): boolean =>
  spans(box.left, box.width, x) && spans(box.top, box.height, y);

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
    point: Point,
    found: PageElement[],
  ): void {
    elements.forEach((element) => {
      this.collectOne(element, point, found);
    });
  }

  private collectOne(
    element: PageElement,
    point: Point,
    found: PageElement[],
  ): void {
    const shadow = element.shadowRoot;
    if (shadow) {
      this.collect(insideShadow(shadow, point), point, found);
    }
    found.push(element);
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
      .filter((element) => covers(element.getBoundingClientRect(), x, y))
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
