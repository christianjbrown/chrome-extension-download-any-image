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

const IMAGE_SETS = new Set(["image-set", "-webkit-image-set"]);
const PER_X: Readonly<Record<string, number>> = {
  x: 1,
  dppx: 1,
  dpi: 1 / 96,
  dpcm: 2.54 / 96,
};

interface Option {
  url: string;
  density: number;
}

// Layers are listed top first, so the first url() wins, and gradients, which
// are drawn rather than downloaded, are passed over. Of an image-set(), the
// sharpest picture is the one worth keeping.
export class CssImageUrls implements CssImages {
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
    const image = functions.find(
      ({ name }) => name === "url" || IMAGE_SETS.has(name),
    );
    if (image === undefined) {
      return undefined;
    }
    return image.name === "url"
      ? unquote(image.args)
      : this.sharpest(image.args);
  }

  private sharpest(args: string): string | undefined {
    const options = splitTopLevel(args)
      .map((option) => this.option(option))
      .filter((option) => option !== undefined);
    options.sort((a, b) => b.density - a.density);
    return options[0]?.url;
  }

  private option(text: string): Option | undefined {
    const url = functionsIn(text).find(({ name }) => name === "url");
    const quoted = leadingString(text);
    const picture = url === undefined ? quoted : `url(${url.args})`;
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
    for (const token of text.trim().split(/\s+/)) {
      const unit = token.replace(/^[\d.]+/, "").toLowerCase();
      const perX = Object.hasOwn(PER_X, unit) ? PER_X[unit] : undefined;
      const amount = Number(token.slice(0, token.length - unit.length));
      if (perX !== undefined && unit !== token && Number.isFinite(amount)) {
        return amount * perX;
      }
    }
    return 1;
  }
}
