// Whatever a script drew on a canvas.
import type { CanvasLike } from "./dom";

export const CANVAS_SOURCE = "canvas";

export interface CanvasFields {
  canvas: CanvasLike;
}
