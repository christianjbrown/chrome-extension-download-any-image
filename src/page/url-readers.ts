import { firstDefined } from "../shared/defined";
import type { ImageSourceOf } from "./image-source";
import type { URL_SOURCE } from "./url-source";
import type {
  BlobAccess,
  BlobLike,
  SourceReader,
  UrlReader,
} from "./image-reading";

// What the person is told when a picture at an address cannot be read.
const BLOB_GONE = "The page has already thrown that image away";
const NOT_DOWNLOADABLE = "That image's address is not one Chrome can download";

// Addresses Chrome can fetch for itself, and ones only this page can read.
const FETCHABLE = /^(?:https?|data):/i;
const BLOB_URL = /^blob:/i;

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
    return (
      firstDefined(this.readers, (reader) => reader.read(source.url)) ??
      Promise.reject(new Error(NOT_DOWNLOADABLE))
    );
  }
}
