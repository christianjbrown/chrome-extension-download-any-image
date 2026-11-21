import type {
  FallbackNames,
  FileExtensions,
  FilenameChooser,
  OriginalNames,
} from "./filename-ports";

// The name the image had on the server when it means something, and otherwise
// the date, the time and the page's title. Either way the extension comes from
// what the file really is.
export class ImageFilenameChooser implements FilenameChooser {
  constructor(
    private readonly originals: OriginalNames,
    private readonly fallback: FallbackNames,
    private readonly extensions: FileExtensions,
  ) {}

  choose(url: string, title: string, mime: string | undefined): string {
    const original = this.originals.from(url);
    return original === undefined
      ? this.named(this.fallback.name(title), mime, undefined)
      : this.named(original.stem, mime, original.extension);
  }

  private named(
    stem: string,
    mime: string | undefined,
    fromUrl: string | undefined,
  ): string {
    return `${stem}.${this.extensions.for(mime, fromUrl)}`;
  }
}
