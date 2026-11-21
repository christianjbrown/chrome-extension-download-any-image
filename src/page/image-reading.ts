import type { ImageSource, ImageSourceOf, SourceKind } from "./dom";

// Turns a picture into an address chrome.downloads can fetch from the service
// worker. Web addresses pass straight through; anything bound to the page has
// to be read here, in the page, and goes across as a data: URL.
export interface SourceReader<S> {
  read(source: S): Promise<string>;
}

export type ImageReading = SourceReader<ImageSource>;

// The reader for each kind of picture.
export type ReadersByKind = {
  [K in SourceKind]: SourceReader<ImageSourceOf<K>>;
};

// One kind of address. Says nothing, with undefined, about an address that is
// not its kind, so it can be asked about any address at all.
export interface UrlReader {
  read(url: string): Promise<string> | undefined;
}

export interface BlobLike {
  readonly size: number;
}

// Reading a blob: URL's bytes, in the page that made it.
export interface BlobAccess {
  fetch(url: string): Promise<BlobLike>;
  toDataUrl(blob: BlobLike): Promise<string>;
}
