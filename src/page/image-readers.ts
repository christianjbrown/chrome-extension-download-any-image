import {
  CANVAS_SOURCE,
  SVG_SOURCE,
  URL_SOURCE,
  type CanvasLike,
  type ImageSource,
  type StyleLook,
  type SvgLike,
} from "./dom";

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

// Turns a picture into an address chrome.downloads can fetch from the service
// worker. Web addresses pass straight through; anything bound to the page has
// to be read here, in the page, and goes across as a data: URL.
export interface ImageReader {
  reads(source: ImageSource): boolean;
  read(source: ImageSource): Promise<string>;
}

type UrlSource = Extract<ImageSource, { kind: typeof URL_SOURCE }>;

const isUrl = (source: ImageSource): source is UrlSource =>
  source.kind === URL_SOURCE;

// http(s) brings the browser's cookies when Chrome fetches it, and data: holds
// its own bytes.
export class PassThroughReader implements ImageReader {
  reads(source: ImageSource): boolean {
    return isUrl(source) && FETCHABLE.test(source.url);
  }

  read(source: ImageSource): Promise<string> {
    return Promise.resolve((source as UrlSource).url);
  }
}

export interface BlobLike {
  readonly size: number;
}

export interface BlobAccess {
  fetch(url: string): Promise<BlobLike>;
  toDataUrl(blob: BlobLike): Promise<string>;
}

// A blob: URL only means something to the page that made it.
export class BlobUrlReader implements ImageReader {
  constructor(private readonly blobs: BlobAccess) {}

  reads(source: ImageSource): boolean {
    return isUrl(source) && BLOB_URL.test(source.url);
  }

  async read(source: ImageSource): Promise<string> {
    let blob: BlobLike;
    try {
      blob = await this.blobs.fetch((source as UrlSource).url);
    } catch {
      throw new Error(BLOB_GONE);
    }
    return this.blobs.toDataUrl(blob);
  }
}

// A canvas with another site's picture drawn on it is "tainted", and the
// browser will not let anyone read it back.
export class CanvasReader implements ImageReader {
  reads(source: ImageSource): boolean {
    return source.kind === CANVAS_SOURCE;
  }

  read(source: ImageSource): Promise<string> {
    const canvas = (source as { canvas: CanvasLike }).canvas;
    try {
      return Promise.resolve(canvas.toDataURL(PNG));
    } catch {
      return Promise.reject(new Error(CANVAS_TAINTED));
    }
  }
}

// An inline SVG as a file of its own: sized as it is on screen when it does not
// say, and in its current colour, which its shapes often borrow.
export class SvgReader implements ImageReader {
  constructor(
    private readonly serialize: (svg: SvgLike) => string,
    private readonly look: StyleLook,
  ) {}

  reads(source: ImageSource): boolean {
    return source.kind === SVG_SOURCE;
  }

  read(source: ImageSource): Promise<string> {
    const svg = (source as { svg: SvgLike }).svg;
    const copy = svg.cloneNode(true);
    const box = svg.getBoundingClientRect();
    for (const name of SIZES) {
      if (!copy.hasAttribute(name)) {
        copy.setAttribute(name, String(box[name]));
      }
    }
    copy.style.setProperty(COLOUR, this.look(svg).getPropertyValue(COLOUR));
    const xml = this.serialize(copy);
    return Promise.resolve(`${SVG_DATA_URL_PREFIX}${encodeURIComponent(xml)}`);
  }
}

export interface ImageReading {
  read(source: ImageSource): Promise<string>;
}

// The first reader that knows the picture's kind.
export class ImageReaders implements ImageReading {
  constructor(private readonly readers: readonly ImageReader[]) {}

  read(source: ImageSource): Promise<string> {
    const reader = this.readers.find((candidate) => candidate.reads(source));
    if (reader === undefined) {
      return Promise.reject(new Error(NOT_DOWNLOADABLE));
    }
    return reader.read(source);
  }
}
