import type { PageElement, StyleDeclaration } from "./dom";
import type { ElementSource } from "./element-source";

// getComputedStyle, for an element of the page or one of its pseudo-elements.
export type ComputedStyle = (
  element: Element,
  pseudo?: string,
) => StyleDeclaration;

// The style the browser computed for an element the page script found.
export class ElementStyles {
  constructor(
    private readonly elements: ElementSource,
    private readonly computed: ComputedStyle,
  ) {}

  look(element: PageElement, pseudo?: string): StyleDeclaration {
    return this.computed(this.elements.element(element), pseudo);
  }
}
