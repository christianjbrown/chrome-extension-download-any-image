import { firstDefined } from "../shared/defined";
import { functionsIn, splitTopLevel, type CssFunction } from "./css-text";
import type { CssImageFunction } from "./css-reading";
import type { CssImages } from "./locating";

// An empty address is no picture.
const nonEmpty = (url: string | undefined): string | undefined =>
  url === "" ? undefined : url;

// Layers are listed top first, so the first picture wins, and gradients, which
// are drawn rather than downloaded, are passed over. Each image function it is
// given names its own picture, so a new function is a new one of those.
export class CssImageUrls implements CssImages {
  private readonly byName: ReadonlyMap<string, CssImageFunction>;

  constructor(functions: readonly CssImageFunction[]) {
    this.byName = new Map(functions.map((reader) => [reader.name, reader]));
  }

  first(value: string): string | undefined {
    return firstDefined(splitTopLevel(value), (layer) =>
      nonEmpty(this.layerUrl(functionsIn(layer))),
    );
  }

  // The picture of the first function in the layer that names one.
  private layerUrl(functions: CssFunction[]): string | undefined {
    const known = functions.find(({ name }) => this.byName.has(name));
    return known === undefined ? undefined : this.pictureOf(known);
  }

  private pictureOf({ name, args }: CssFunction): string | undefined {
    return this.byName.get(name)?.picture(args);
  }
}
