import type { CANVAS_SOURCE } from "./canvas-source";
import type { ImageSourceOf } from "./image-source";
import type { SourceReader } from "./image-reading";

// What the person is told when a canvas cannot be read.
const CANVAS_TAINTED =
  "That canvas has another site's picture on it, so the browser will not hand it over";

// A canvas is read out as a PNG, which keeps every pixel as drawn.
const PNG = "image/png";

// A canvas with another site's picture drawn on it is "tainted", and the
// browser will not let anyone read it back.
export class CanvasReader implements SourceReader<
  ImageSourceOf<typeof CANVAS_SOURCE>
> {
  read(source: ImageSourceOf<typeof CANVAS_SOURCE>): Promise<string> {
    try {
      return Promise.resolve(source.canvas.toDataURL(PNG));
    } catch {
      return Promise.reject(new Error(CANVAS_TAINTED));
    }
  }
}
