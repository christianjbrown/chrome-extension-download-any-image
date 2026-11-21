// What reading the picture out of a CSS image value is made of.
import type { PageElement, StyleDeclaration } from "./dom";

// The computed style a CSS finder reads on an element, or none when what it
// reads is not drawn.
export interface ElementStyle {
  of(element: PageElement): StyleDeclaration | undefined;
}

// One CSS image function, url() or image-set() say, and the picture it names.
export interface CssImageFunction {
  readonly name: string;
  picture(args: string): string | undefined;
}

// A unit an image-set() option's density can be written in, and how many x
// one of it is.
export interface ResolutionUnit {
  readonly unit: string;
  readonly perX: number;
}
