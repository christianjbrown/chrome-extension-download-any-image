import type { ImageType } from "./filename-ports";

// What an image type with no other extensions has besides its own.
const NO_OTHERS: readonly string[] = [];

// A JPEG photo.
export class JpegType implements ImageType {
  readonly mimes = ["image/jpeg", "image/pjpeg"];
  readonly extension = "jpg";
  readonly otherExtensions = ["jpeg"];
}

// A PNG, animated or not.
export class PngType implements ImageType {
  readonly mimes = ["image/png", "image/apng"];
  readonly extension = "png";
  readonly otherExtensions = NO_OTHERS;
}

// A GIF.
export class GifType implements ImageType {
  readonly mimes = ["image/gif"];
  readonly extension = "gif";
  readonly otherExtensions = NO_OTHERS;
}

// A WebP.
export class WebpType implements ImageType {
  readonly mimes = ["image/webp"];
  readonly extension = "webp";
  readonly otherExtensions = NO_OTHERS;
}

// An AVIF.
export class AvifType implements ImageType {
  readonly mimes = ["image/avif"];
  readonly extension = "avif";
  readonly otherExtensions = NO_OTHERS;
}

// An SVG drawing.
export class SvgType implements ImageType {
  readonly mimes = ["image/svg+xml"];
  readonly extension = "svg";
  readonly otherExtensions = NO_OTHERS;
}

// A Windows bitmap.
export class BmpType implements ImageType {
  readonly mimes = ["image/bmp"];
  readonly extension = "bmp";
  readonly otherExtensions = NO_OTHERS;
}

// A Windows icon, under either of its names.
export class IconType implements ImageType {
  readonly mimes = ["image/x-icon", "image/vnd.microsoft.icon"];
  readonly extension = "ico";
  readonly otherExtensions = NO_OTHERS;
}

// A TIFF.
export class TiffType implements ImageType {
  readonly mimes = ["image/tiff"];
  readonly extension = "tiff";
  readonly otherExtensions = ["tif"];
}

// A HEIC photo.
export class HeicType implements ImageType {
  readonly mimes = ["image/heic"];
  readonly extension = "heic";
  readonly otherExtensions = NO_OTHERS;
}

// A HEIF photo.
export class HeifType implements ImageType {
  readonly mimes = ["image/heif"];
  readonly extension = "heif";
  readonly otherExtensions = NO_OTHERS;
}

// A JPEG XL.
export class JxlType implements ImageType {
  readonly mimes = ["image/jxl"];
  readonly extension = "jxl";
  readonly otherExtensions = NO_OTHERS;
}
