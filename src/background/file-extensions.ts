import { firstDefined } from "../shared/defined";
import type { FileExtensions, ImageType } from "./filename-ports";
import { mimeEssence } from "./mime-type";

// What a file of no known type is written as.
const UNKNOWN_EXTENSION = "bin";

// Some other image/ type: its own name, as image/x-portable-pixmap is "portable-pixmap".
const IMAGE_SUBTYPE = /^image\/(?:x-)?([a-z0-9-]+)/;
const SUBTYPE_GROUP = 1;

const imageSubtype = (type: string): string | undefined =>
  IMAGE_SUBTYPE.exec(type)?.at(SUBTYPE_GROUP);

// What the file is, by the type the server or the page said, since an address
// ending .jpg can quite happily serve a WebP.
//
// The address's own extension is believed only when an image has it. Anything
// else it claims, .exe or .html say, is the page's choice of what lands in the
// downloads folder, and the file is written as .bin instead.
//
// The image types it knows are the ones it is given, so a new type is a new
// one of those.
export class MimeExtensions implements FileExtensions {
  private readonly byMime: ReadonlyMap<string, string>;
  private readonly imageExtensions: ReadonlySet<string>;

  constructor(types: readonly ImageType[]) {
    this.byMime = new Map(
      types.flatMap(({ mimes, extension }) =>
        mimes.map((mime) => [mime, extension] as const),
      ),
    );
    this.imageExtensions = new Set(
      types.flatMap(({ extension, otherExtensions }) => [
        extension,
        ...otherExtensions,
      ]),
    );
  }

  for(mime: string | undefined, fromUrl: string | undefined): string {
    const type = mimeEssence(mime);
    // Best first: a type it knows, another image type, the address's own.
    const guesses = [
      () => this.byMime.get(type),
      () => imageSubtype(type),
      () => this.fromAddress(fromUrl),
    ];
    return firstDefined(guesses, (guess) => guess()) ?? UNKNOWN_EXTENSION;
  }

  private fromAddress(fromUrl: string | undefined): string | undefined {
    return this.isImageExtension(fromUrl) ? fromUrl : undefined;
  }

  private isImageExtension(fromUrl: string | undefined): fromUrl is string {
    return fromUrl !== undefined && this.imageExtensions.has(fromUrl);
  }
}
