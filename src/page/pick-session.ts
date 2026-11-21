import type { HoverStop } from "./outlining";
import type {
  Clearing,
  PickControl,
  PickFlow,
  SessionPart,
} from "./pick-control";

// One frame's wait for the click: arms its parts, and takes everything they
// added away again once the wait is over, however it ends.
export class PickSession implements PickControl {
  constructor(
    private readonly parts: readonly SessionPart[],
    private readonly bindings: Clearing,
    private readonly hover: HoverStop,
    private readonly flow: PickFlow,
  ) {}

  arm(): void {
    for (const part of this.parts) {
      part.arm(this);
    }
  }

  // Takes away everything arm() added. Safe to call more than once.
  disarm(): void {
    this.bindings.clear();
    this.hover.stop();
  }

  stop(): void {
    this.disarm();
    this.flow.cancel();
  }

  pick(x: number, y: number): void {
    this.disarm();
    void this.flow.pick(x, y);
  }
}
