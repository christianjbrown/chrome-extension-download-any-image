import type { CanvasLike, ImageSource, StyleLook, SvgLike } from "./dom";

// Turns a picture into an address chrome.downloads can fetch from the service
// worker. Web addresses pass straight through; anything bound to the page has
// to be read here, in the page, and goes across as a data: URL.
export interface ImageReader {
  reads(source: ImageSource): boolean;
  read(source: ImageSource): Promise<string>;
}

type UrlSource = Extract<ImageSource, { kind: "url" }>;

const isUrl = (source: ImageSource): source is UrlSource =>
  source.kind === "url";

// http(s) brings the browser's cookies when Chrome fetches it, and data: holds
// its own bytes.
export class PassThroughReader implements ImageReader {
  reads(source: ImageSource): boolean {
    return isUrl(source) && /^(?:https?|data):/i.test(source.url);
  }

  read(source: ImageSource): Promise<string> {
    return Promise.resolve((source as UrlSource).url);
  }
}

interface BlobLike {
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
    return isUrl(source) && /^blob:/i.test(source.url);
  }

  async read(source: ImageSource): Promise<string> {
    let blob: BlobLike;
    try {
      blob = await this.blobs.fetch((source as UrlSource).url);
    } catch {
      throw new Error("The page has already thrown that image away");
    }
    return this.blobs.toDataUrl(blob);
  }
}

// A canvas with another site's picture drawn on it is "tainted", and the
// browser will not let anyone read it back.
export class CanvasReader implements ImageReader {
  reads(source: ImageSource): boolean {
    return source.kind === "canvas";
  }

  read(source: ImageSource): Promise<string> {
    const canvas = (source as { canvas: CanvasLike }).canvas;
    try {
      return Promise.resolve(canvas.toDataURL("image/png"));
    } catch {
      return Promise.reject(
        new Error(
          "That canvas has another site's picture on it, so the browser will not hand it over",
        ),
      );
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
    return source.kind === "svg";
  }

  read(source: ImageSource): Promise<string> {
    const svg = (source as { svg: SvgLike }).svg;
    const copy = svg.cloneNode(true);
    const box = svg.getBoundingClientRect();
    for (const [name, size] of [
      ["width", box.width],
      ["height", box.height],
    ] as const) {
      if (!copy.hasAttribute(name)) {
        copy.setAttribute(name, String(size));
      }
    }
    copy.style.setProperty("color", this.look(svg).getPropertyValue("color"));
    const xml = this.serialize(copy);
    return Promise.resolve(
      `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`,
    );
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
      return Promise.reject(
        new Error("That image's address is not one Chrome can download"),
      );
    }
    return reader.read(source);
  }
}
