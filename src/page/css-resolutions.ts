import type { ResolutionUnit } from "./css-reading";

// CSS fixes a pixel at a 96th of an inch, and an inch is 2.54cm.
const CSS_DPI = 96;
const CM_PER_INCH = 2.54;
const ONE_X = 1;

// Pictures per CSS pixel.
export class XUnit implements ResolutionUnit {
  readonly unit = "x";
  readonly perX = ONE_X;
}

// Dots per CSS pixel, which is the same thing as x.
export class DppxUnit implements ResolutionUnit {
  readonly unit = "dppx";
  readonly perX = ONE_X;
}

// Dots per inch.
export class DpiUnit implements ResolutionUnit {
  readonly unit = "dpi";
  readonly perX = ONE_X / CSS_DPI;
}

// Dots per centimetre.
export class DpcmUnit implements ResolutionUnit {
  readonly unit = "dpcm";
  readonly perX = CM_PER_INCH / CSS_DPI;
}
