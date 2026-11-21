import { functionsIn, splitTopLevel, type CssFunction } from "./css-text";
import type { CssImageFunction } from "./css-reading";
import type { CssImages } from "./locating";

// Layers are listed top first, so the first picture wins, and gradients, which
// are drawn rather than downloaded, are passed over. Each image function it is
// given names its own picture, so a new function is a new one of those.
export class CssImageUrls implements CssImages {
  private readonly byName: ReadonlyMap<string, CssImageFunction>;

  constructor(functions: readonly CssImageFunction[]) {
    this.byName = new Map(functions.map((reader) => [reader.name, reader]));
  }

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
      const reader = this.byName.get(name);
      if (reader !== undefined) {
        return reader.picture(args);
      }
    }
    return undefined;
  }
}
