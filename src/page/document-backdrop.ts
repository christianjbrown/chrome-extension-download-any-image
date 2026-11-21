import type { PageElement } from "./dom";
import type { Backdrop } from "./locating";

// The part of a document the page's backdrop is.
export interface BackdropDocument {
  readonly documentElement: unknown;
  readonly body: unknown;
}

// The page's own root and body, which sit under everything.
export class DocumentBackdrop implements Backdrop {
  constructor(private readonly document: BackdropDocument) {}

  isBackdrop(element: PageElement): boolean {
    return (
      element === this.document.documentElement ||
      element === this.document.body
    );
  }
}
