import type {
  CANVAS_SOURCE,
  ImageSource,
  ImageSourceOf,
  SourceKind,
  StyleLook,
  SVG_SOURCE,
  URL_SOURCE,
} from "./dom";
import type {
  BlobAccess,
  BlobLike,
  ImageReading,
  ReadersByKind,
  SourceReader,
  SvgSerializer,
  UrlReader,
} from "./image-reading";

// What the person is told when a picture cannot be read.
const BLOB_GONE = "The page has already thrown that image away";
const CANVAS_TAINTED =
  "That canvas has another site's picture on it, so the browser will not hand it over";
const NOT_DOWNLOADABLE = "That image's address is not one Chrome can download";

// Addresses Chrome can fetch for itself, and ones only this page can read.
const FETCHABLE = /^(?:https?|data):/i;
const BLOB_URL = /^blob:/i;

// A canvas is read out as a PNG, which keeps every pixel as drawn.
const PNG = "image/png";

// An SVG goes across as its own text.
const SVG_DATA_URL_PREFIX = "data:image/svg+xml;charset=utf-8,";

// The sizes an SVG is given when it does not say, and the property its shapes
// often borrow their colour from.
const SIZES = ["width", "height"] as const;
const COLOUR = "color";

// http(s) brings the browser's cookies when Chrome fetches it, and data: holds
// its own bytes.
export class PassThroughReader implements UrlReader {
  read(url: string): Promise<string> | undefined {
    return FETCHABLE.test(url) ? Promise.resolve(url) : undefined;
  }
}

// A blob: URL only means something to the page that made it.
export class BlobUrlReader implements UrlReader {
  constructor(private readonly blobs: BlobAccess) {}

  read(url: string): Promise<string> | undefined {
    return BLOB_URL.test(url) ? this.readBlob(url) : undefined;
  }

  private async readBlob(url: string): Promise<string> {
    let blob: BlobLike;
    try {
      blob = await this.blobs.fetch(url);
    } catch {
      throw new Error(BLOB_GONE);
    }
    return this.blobs.toDataUrl(blob);
  }
}

// A picture at an address: the first reader that knows the address's kind.
export class UrlReaders implements SourceReader<
  ImageSourceOf<typeof URL_SOURCE>
> {
  constructor(private readonly readers: readonly UrlReader[]) {}

  read(source: ImageSourceOf<typeof URL_SOURCE>): Promise<string> {
    for (const reader of this.readers) {
      const read = reader.read(source.url);
      if (read !== undefined) {
        return read;
      }
    }
    return Promise.reject(new Error(NOT_DOWNLOADABLE));
  }
}

// A canvas with another site's picture drawn on it is "tainted", and the
// browser will not let anyone read it back.
export class CanvasReader implements SourceReader<
  ImageSourceOf<typeof CANVAS_SOURCE>
> {
  read(source: ImageSourceOf<typeof CANVAS_SOURCE>): Promise<string> {
    try {
      return Promise.resolve(source.canvas.toDataURL(PNG));
    } catch {
      return Promise.reject(new Error(CANVAS_TAINTED));
    }
  }
}

// An inline SVG as a file of its own: sized as it is on screen when it does not
// say, and in its current colour, which its shapes often borrow.
export class SvgReader implements SourceReader<
  ImageSourceOf<typeof SVG_SOURCE>
> {
  constructor(
    private readonly serializer: SvgSerializer,
    private readonly look: StyleLook,
  ) {}

  read(source: ImageSourceOf<typeof SVG_SOURCE>): Promise<string> {
    const svg = source.svg;
    const copy = svg.cloneNode(true);
    const box = svg.getBoundingClientRect();
    for (const name of SIZES) {
      if (!copy.hasAttribute(name)) {
        copy.setAttribute(name, String(box[name]));
      }
    }
    copy.style.setProperty(COLOUR, this.look(svg).getPropertyValue(COLOUR));
    const xml = this.serializer.serialize(copy);
    return Promise.resolve(`${SVG_DATA_URL_PREFIX}${encodeURIComponent(xml)}`);
  }
}

// Hands each picture to the reader for its kind. A new kind is a new reader in
// the map, which the type insists on.
export class ImageReaders implements ImageReading {
  constructor(private readonly byKind: ReadersByKind) {}

  read(source: ImageSource): Promise<string> {
    return this.readOfKind(source);
  }

  private readOfKind<K extends SourceKind>(
    source: ImageSourceOf<K>,
  ): Promise<string> {
    const reader: SourceReader<ImageSourceOf<K>> = this.byKind[source.kind];
    return reader.read(source);
  }
}
