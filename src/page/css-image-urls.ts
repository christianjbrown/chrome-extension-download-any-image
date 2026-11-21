import {
  functionsIn,
  leadingString,
  splitTopLevel,
  unquote,
  type CssFunction,
} from "./css-text";

export interface CssImages {
  // The topmost real picture in a computed image value, if there is one.
  first(value: string): string | undefined;
}

const URL_FUNCTION = "url";
const IMAGE_SET = "image-set";
const WEBKIT_IMAGE_SET = "-webkit-image-set";

// CSS fixes a pixel at a 96th of an inch, and an inch is 2.54cm.
const CSS_DPI = 96;
const CM_PER_INCH = 2.54;
const PER_X: Readonly<Record<string, number>> = {
  x: 1,
  dppx: 1,
  dpi: 1 / CSS_DPI,
  dpcm: CM_PER_INCH / CSS_DPI,
};

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

// Layers are listed top first, so the first url() wins, and gradients, which
// are drawn rather than downloaded, are passed over. Of an image-set(), the
// sharpest picture is the one worth keeping.
export class CssImageUrls implements CssImages {
  // How each image function names its picture. A new function is a new entry.
  private readonly readers: ReadonlyMap<
    string,
    (args: string) => string | undefined
  > = new Map([
    [URL_FUNCTION, unquote],
    [IMAGE_SET, (args: string) => this.sharpest(args)],
    [WEBKIT_IMAGE_SET, (args: string) => this.sharpest(args)],
  ]);

  first(value: string): string | undefined {
    for (const layer of splitTopLevel(value)) {
      const url = this.layerUrl(functionsIn(layer));
      if (url !== undefined && url !== "") {
        return url;
      }
    }
    return undefined;
  }

  private layerUrl(functions: CssFunction[]): string | undefined {
    for (const { name, args } of functions) {
      const read = this.readers.get(name);
      if (read !== undefined) {
        return read(args);
      }
    }
    return undefined;
  }

  private sharpest(args: string): string | undefined {
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
      const perX = Object.hasOwn(PER_X, unit) ? PER_X[unit] : undefined;
      const amount = Number(token.slice(0, token.length - unit.length));
      if (perX !== undefined && unit !== token && Number.isFinite(amount)) {
        return amount * perX;
      }
    }
    return ONE_X;
  }
}
