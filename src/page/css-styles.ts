import type { PageElement, StyleDeclaration, StyleLook } from "./dom";
import type { ElementStyle } from "./css-reading";

// The pseudo-elements that can paint a picture over their element.
export const BEFORE = "::before";
export const AFTER = "::after";
export type Pseudo = typeof BEFORE | typeof AFTER;

// The property that says whether a pseudo-element is drawn, and the values
// that mean it is not.
const CONTENT = "content";
const NOT_DRAWN: ReadonlySet<string> = new Set(["", "none", "normal"]);

// The element's own style.
export class OwnStyle implements ElementStyle {
  constructor(private readonly look: StyleLook) {}

  of(element: PageElement): StyleDeclaration {
    return this.look(element);
  }
}

// A pseudo-element's style, which only counts when its content is something,
// since otherwise it is not drawn.
export class PseudoStyle implements ElementStyle {
  constructor(
    private readonly look: StyleLook,
    private readonly pseudo: Pseudo,
  ) {}

  of(element: PageElement): StyleDeclaration | undefined {
    const style = this.look(element, this.pseudo);
    return NOT_DRAWN.has(style.getPropertyValue(CONTENT)) ? undefined : style;
  }
}
