// The pictures there are to save, one kind for each way a page can hold one.
// Each kind is declared in a module of its own, and a new one is one more
// line in SourceFields here.
import type { CANVAS_SOURCE, CanvasFields } from "./canvas-source";
import type { SVG_SOURCE, SvgFields } from "./svg-source";
import type { URL_SOURCE, UrlFields } from "./url-source";

// What each kind of picture carries.
interface SourceFields {
  [URL_SOURCE]: UrlFields;
  [CANVAS_SOURCE]: CanvasFields;
  [SVG_SOURCE]: SvgFields;
}

export type SourceKind = keyof SourceFields;

// A picture of one kind, or of any of several. Written as a map over the
// kinds so a reader picked by kind takes that kind's picture without a cast.
export type ImageSourceOf<K extends SourceKind> = {
  [P in K]: { kind: P } & SourceFields[P];
}[K];

export type ImageSource = ImageSourceOf<SourceKind>;
