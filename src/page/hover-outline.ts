import type { Locator } from "./image-locator";
import type { Outline } from "./outline-box";

export type FrameScheduler = (callback: () => void) => void;

export interface Hover {
  follow(x: number, y: number): void;
  stop(): void;
}

// Outlines whatever a click would pick, at most once a frame however fast the
// pointer moves.
export class HoverOutline implements Hover {
  private point: { x: number; y: number } | undefined;
  private scheduled = false;
  private stopped = false;

  constructor(
    private readonly locator: Locator,
    private readonly outline: Outline,
    private readonly nextFrame: FrameScheduler,
  ) {}

  follow(x: number, y: number): void {
    this.point = { x, y };
    if (this.scheduled || this.stopped) {
      return;
    }
    this.scheduled = true;
    this.nextFrame(() => {
      this.draw();
    });
  }

  stop(): void {
    this.stopped = true;
    this.outline.hide();
  }

  private draw(): void {
    this.scheduled = false;
    if (this.stopped || this.point === undefined) {
      return;
    }
    const found = this.locator.locate(this.point.x, this.point.y);
    if (found === undefined) {
      this.outline.hide();
      return;
    }
    this.outline.show(found.element.getBoundingClientRect());
  }
}
