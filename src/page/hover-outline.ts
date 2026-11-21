import type { Locator } from "./locating";
import type { HoverFollow, HoverStop, Outline } from "./outlining";

interface Point {
  x: number;
  y: number;
}

export type FrameScheduler = (callback: () => void) => void;

// Outlines whatever a click would pick, at most once a frame however fast the
// pointer moves.
export class HoverOutline implements HoverFollow, HoverStop {
  private point: Point | undefined;
  private scheduled = false;
  private stopped = false;

  constructor(
    private readonly locator: Locator,
    private readonly outline: Outline,
    private readonly nextFrame: FrameScheduler,
  ) {}

  follow(x: number, y: number): void {
    this.point = { x, y };
    if (this.waiting()) {
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

  // A frame is already on its way, or there will be no more.
  private waiting(): boolean {
    return this.scheduled || this.stopped;
  }

  private draw(): void {
    this.scheduled = false;
    const point = this.livePoint();
    if (point !== undefined) {
      this.outlineAt(point);
    }
  }

  private livePoint(): Point | undefined {
    return this.stopped ? undefined : this.point;
  }

  private outlineAt(point: Point): void {
    const found = this.locator.locate(point.x, point.y);
    if (found === undefined) {
      this.outline.hide();
      return;
    }
    this.outline.show(found.element.getBoundingClientRect());
  }
}
