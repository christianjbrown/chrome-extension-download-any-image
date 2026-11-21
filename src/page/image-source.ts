// The pictures there are to save, one kind for each way a page can hold one.
import type { CanvasLike, SvgLike } from "./dom";

// The kinds of picture there are to save.
export const URL_SOURCE = "url";
export const CANVAS_SOURCE = "canvas";
export const SVG_SOURCE = "svg";

// What each kind of picture carries.
interface SourceFields {
  [URL_SOURCE]: { url: string };
  [CANVAS_SOURCE]: { canvas: CanvasLike };
  [SVG_SOURCE]: { svg: SvgLike };
}

export type SourceKind = keyof SourceFields;

// A picture of one kind, or of any of several. Written as a map over the
// kinds so a reader picked by kind takes that kind's picture without a cast.
export type ImageSourceOf<K extends SourceKind> = {
  [P in K]: { kind: P } & SourceFields[P];
}[K];

export type ImageSource = ImageSourceOf<SourceKind>;
