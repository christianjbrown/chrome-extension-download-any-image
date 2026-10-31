export interface FileExtensions {
  for(mime: string | undefined, fromUrl: string | undefined): string;
}

const BY_MIME: Readonly<Record<string, string>> = {
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
};

// What the file is, by the type the server or the page said, since an address
// ending .jpg can quite happily serve a WebP.
export class MimeExtensions implements FileExtensions {
  for(mime: string | undefined, fromUrl: string | undefined): string {
    const raw = mime ?? "";
    const end = raw.indexOf(";");
    const type = (end === -1 ? raw : raw.slice(0, end)).trim().toLowerCase();
    const known = Object.hasOwn(BY_MIME, type) ? BY_MIME[type] : undefined;
    return known ?? this.subtype(type) ?? fromUrl ?? "bin";
  }

  // Some other image/ type: its own name, as image/x-portable-pixmap is "portable-pixmap".
  private subtype(type: string): string | undefined {
    const match = /^image\/(?:x-)?([a-z0-9-]+)/.exec(type);
    return match?.[1];
  }
}
