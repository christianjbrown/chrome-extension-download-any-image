import { functionsIn, leadingString, splitTopLevel, unquote } from "./css-text";
import type { CssImageFunction, ResolutionUnit } from "./css-reading";

// The functions that name a picture, as CSS spells them.
const URL_FUNCTION = "url";
export const IMAGE_SET = "image-set";
export const WEBKIT_IMAGE_SET = "-webkit-image-set";

// How an image-set() option's density is written: a number, then its unit,
// with options' parts set apart by spaces.
const LEADING_NUMBER = /^[\d.]+/;
const SPACES = /\s+/;

// What a picture in an image-set() is when it does not say.
const ONE_X = 1;

interface Option {
  url: string;
  density: number;
}

// url(), whose argument is the address itself.
export class UrlFunction implements CssImageFunction {
  readonly name = URL_FUNCTION;

  picture(args: string): string | undefined {
    return unquote(args);
  }
}

// image-set() and its prefixed twin, of whose pictures the sharpest is the one
// worth keeping. Densities are read in the units it is given, so a new unit is
// a new one of those.
export class ImageSetFunction implements CssImageFunction {
  private readonly perX: ReadonlyMap<string, number>;

  constructor(
    readonly name: string,
    units: readonly ResolutionUnit[],
  ) {
    this.perX = new Map(units.map(({ unit, perX }) => [unit, perX]));
  }

  picture(args: string): string | undefined {
    const options = splitTopLevel(args)
      .map((option) => this.option(option))
      .filter((option) => option !== undefined);
    options.sort((a, b) => b.density - a.density);
    return options[0]?.url;
  }

  private option(text: string): Option | undefined {
    const url = functionsIn(text).find(({ name }) => name === URL_FUNCTION);
    const quoted = leadingString(text);
    const picture = url === undefined ? quoted : `${URL_FUNCTION}(${url.args})`;
    if (picture === undefined) {
      return undefined;
    }
    const rest = text.replace(picture, "");
    return {
      url: unquote(url === undefined ? picture : url.args),
      density: this.density(rest),
    };
  }

  // "2x", "192dpi" and so on. A picture that does not say is 1x.
  private density(text: string): number {
    for (const token of text.trim().split(SPACES)) {
      const unit = token.replace(LEADING_NUMBER, "").toLowerCase();
      const perX = this.perX.get(unit);
      const amount = Number(token.slice(0, token.length - unit.length));
      if (perX !== undefined && unit !== token && Number.isFinite(amount)) {
        return amount * perX;
      }
    }
    return ONE_X;
  }
}
