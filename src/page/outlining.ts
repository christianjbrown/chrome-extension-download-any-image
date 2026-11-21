// What drawing the frame round the picture under the pointer is made of.
import type { Box } from "./dom";

// The frame's own element.
export interface OverlayElement {
  readonly style: { setProperty(name: string, value: string): void };
  remove(): void;
}

// Where the frame is made and put: a new element, readied by the caller
// before it goes on the page.
export interface OverlayHost {
  add(ready: (element: OverlayElement) => void): OverlayElement;
}

// The frame round a box on screen.
export interface Outline {
  show(box: Box): void;
  hide(): void;
}

// Outlining what is under the pointer, and stopping again, split by who asks.
export interface HoverFollow {
  follow(x: number, y: number): void;
}

export interface HoverStop {
  stop(): void;
}
