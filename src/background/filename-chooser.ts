import type { FileExtensions } from "./file-extensions";
import type { OriginalNames } from "./original-name";
import type { FallbackNames } from "./timestamped-name";

export interface FilenameChooser {
  choose(url: string, title: string, mime: string | undefined): string;
}

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
    const stem = original?.stem ?? this.fallback.name(title);
    return `${stem}.${this.extensions.for(mime, original?.extension)}`;
  }
}
