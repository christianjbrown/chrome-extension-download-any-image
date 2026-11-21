// What finding the picture under a point is made of.
import type { PageElement } from "./dom";
import type { ImageSource } from "./image-source";

// One way an element can show a picture.
export interface ImageFinder {
  find(element: PageElement): ImageSource | undefined;
}

// An element kind that can be found by where it sits on the page, so a
// picture with pointer-events: none is still under the point.
export interface PlacedKind {
  readonly selector: string;
}

export interface FoundImage {
  element: PageElement;
  source: ImageSource;
}

export interface Locator {
  locate(x: number, y: number): FoundImage | undefined;
}

// Elements under a point, topmost first.
export interface HitSource {
  at(x: number, y: number): PageElement[];
}

// The page's own backdrop, which a click on plain text should not pick.
export interface Backdrop {
  isBackdrop(element: PageElement): boolean;
}

export interface CssImages {
  // The topmost real picture in a computed image value, if there is one.
  first(value: string): string | undefined;
}
