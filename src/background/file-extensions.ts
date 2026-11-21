import { mimeEssence } from "./mime-type";

export interface FileExtensions {
  for(mime: string | undefined, fromUrl: string | undefined): string;
}

// The image types there are names for, and the extensions an address is
// believed about.
export interface ImageTypes {
  byMime: Readonly<Record<string, string>>;
  // Extensions an image has besides the ones byMime gives.
  otherExtensions: readonly string[];
}

export const IMAGE_TYPES: ImageTypes = {
  byMime: {
    "image/jpeg": "jpg",
    "image/pjpeg": "jpg",
    "image/png": "png",
    "image/apng": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "image/avif": "avif",
    "image/svg+xml": "svg",
    "image/bmp": "bmp",
    "image/x-icon": "ico",
    "image/vnd.microsoft.icon": "ico",
    "image/tiff": "tiff",
    "image/heic": "heic",
    "image/heif": "heif",
    "image/jxl": "jxl",
  },
  otherExtensions: ["jpeg", "tif"],
};

// What a file of no known type is written as.
const UNKNOWN_EXTENSION = "bin";

// Some other image/ type: its own name, as image/x-portable-pixmap is "portable-pixmap".
const IMAGE_SUBTYPE = /^image\/(?:x-)?([a-z0-9-]+)/;
const SUBTYPE_GROUP = 1;

// What the file is, by the type the server or the page said, since an address
// ending .jpg can quite happily serve a WebP.
//
// The address's own extension is believed only when an image has it. Anything
// else it claims, .exe or .html say, is the page's choice of what lands in the
// downloads folder, and the file is written as .bin instead.
export class MimeExtensions implements FileExtensions {
  private readonly imageExtensions: ReadonlySet<string>;

  constructor(private readonly types: ImageTypes) {
    this.imageExtensions = new Set([
      ...Object.values(types.byMime),
      ...types.otherExtensions,
    ]);
  }

  for(mime: string | undefined, fromUrl: string | undefined): string {
    const type = mimeEssence(mime);
    const known = Object.hasOwn(this.types.byMime, type)
      ? this.types.byMime[type]
      : undefined;
    return (
      known ??
      IMAGE_SUBTYPE.exec(type)?.at(SUBTYPE_GROUP) ??
      this.fromAddress(fromUrl) ??
      UNKNOWN_EXTENSION
    );
  }

  private fromAddress(fromUrl: string | undefined): string | undefined {
    return fromUrl !== undefined && this.imageExtensions.has(fromUrl)
      ? fromUrl
      : undefined;
  }
}
