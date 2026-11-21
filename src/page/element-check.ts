import type { ElementSource } from "./element-source";

// What the person is told if the page hands over something that only looks
// like an element.
const NOT_AN_ELEMENT = "That is not an element on the page";

// Checks a port really is one of the browser's elements, and refuses anything
// else the way the browser's own functions would.
export class ElementCheck implements ElementSource {
  constructor(
    private readonly isElement: (value: unknown) => value is Element,
  ) {}

  element<T extends object>(value: T): T & Element {
    if (!this.isElement(value)) {
      throw new TypeError(NOT_AN_ELEMENT);
    }
    return value;
  }
}
