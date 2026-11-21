import type { BlobAccess, BlobLike } from "./image-reading";

// What the person is told when the browser cannot read a blob's bytes.
const UNREADABLE = "The image could not be read";

// The part of a fetch Response this needs.
interface BlobResponse {
  blob(): Promise<BlobLike>;
}

export type Fetcher = (url: string) => Promise<BlobResponse>;

// The part of a FileReader this needs.
export interface DataUrlReader {
  readonly result: unknown;
  onload: (() => void) | null;
  onerror: (() => void) | null;
  readAsDataURL(blob: BlobLike): void;
}

// Reads a blob: URL's bytes in the page that made it, and turns them into a
// data: URL the service worker can download.
export class PageBlobs implements BlobAccess {
  constructor(
    private readonly fetcher: Fetcher,
    private readonly newReader: () => DataUrlReader,
  ) {}

  async fetch(url: string): Promise<BlobLike> {
    const response = await this.fetcher(url);
    return response.blob();
  }

  toDataUrl(blob: BlobLike): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = this.newReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error(UNREADABLE));
      };
      reader.readAsDataURL(blob);
    });
  }
}
