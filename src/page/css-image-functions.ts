import { firstDefined } from "../shared/defined";
import {
  functionsIn,
  leadingString,
  splitTopLevel,
  unquote,
  type CssFunction,
} from "./css-text";
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

// The picture an option names: as it is written there, and its address.
interface Named {
  written: string;
  address: string;
}

const isUrlFunction = ({ name }: CssFunction): boolean => name === URL_FUNCTION;

const quotedPicture = (text: string): Named | undefined =>
  namedBy(leadingString(text));

const namedBy = (quoted: string | undefined): Named | undefined =>
  quoted === undefined ? undefined : { written: quoted, address: quoted };

// A token with no number in front of its unit says nothing.
const numberBefore = (token: string, unit: string): number =>
  unit === token
    ? Number.NaN
    : Number(token.slice(0, token.length - unit.length));

function densityOf(
  token: string,
  unit: string,
  perX: number,
): number | undefined {
  const amount = numberBefore(token, unit);
  return Number.isFinite(amount) ? amount * perX : undefined;
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
    const named = this.named(text);
    return named === undefined ? undefined : this.optionOf(named, text);
  }

  // A url() if the option has one, and otherwise a quoted string.
  private named(text: string): Named | undefined {
    const url = functionsIn(text).find(isUrlFunction);
    return url === undefined
      ? quotedPicture(text)
      : { written: `${URL_FUNCTION}(${url.args})`, address: url.args };
  }

  private optionOf(named: Named, text: string): Option {
    return {
      url: unquote(named.address),
      density: this.density(text.replace(named.written, "")),
    };
  }

  // "2x", "192dpi" and so on. A picture that does not say is 1x.
  private density(text: string): number {
    return (
      firstDefined(text.trim().split(SPACES), (token) =>
        this.tokenDensity(token),
      ) ?? ONE_X
    );
  }

  private tokenDensity(token: string): number | undefined {
    const unit = token.replace(LEADING_NUMBER, "").toLowerCase();
    const perX = this.perX.get(unit);
    return perX === undefined ? undefined : densityOf(token, unit, perX);
  }
}
