import type { OriginalName, OriginalNames } from "./filename-ports";
import type { NameFilter } from "./name-filter";
import type { TextCleaner } from "./text-cleaner";

const WEB = /^https?:$/;
const PATH_SEPARATOR = "/";
const CASE_INSENSITIVE = "i";

// What an address with no path worth reading yields as its last part.
const NO_SEGMENT = "";

// The name and the extension, out of a match of the split pattern.
const STEM_ONLY = "$1";
const EXTENSION_ONLY = "$2";

function decoded(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
}

// Only a web address has a path worth reading. Bytes the page handed over
// arrive as data: URLs, which have none.
function isWeb(parsed: URL | null): parsed is URL {
  return parsed !== null && WEB.test(parsed.protocol);
}

function lastPathPart(pathname: string): string {
  const segments = pathname.split(PATH_SEPARATOR).filter((part) => part !== "");
  return decoded(segments.at(-1) ?? NO_SEGMENT);
}

// The last part of a web address's path, split into the name and an
// extension, kept when it means something.
export class UrlOriginalNames implements OriginalNames {
  private readonly split: RegExp;

  constructor(
    // The longest ending that counts as an extension rather than part of the name.
    maxExtensionLength: number,
    // Makes a name from the address safe to keep.
    private readonly stems: TextCleaner,
    // Whether the name is worth keeping.
    private readonly filter: NameFilter,
  ) {
    this.split = new RegExp(
      `^(.+)\\.([a-z0-9]{1,${String(maxExtensionLength)}})$`,
      CASE_INSENSITIVE,
    );
  }

  from(url: string): OriginalName | undefined {
    const segment = this.lastSegment(url);
    // A segment with no extension is all name.
    const stem = this.stems.clean(segment.replace(this.split, STEM_ONLY));
    return this.filter.keeps(stem)
      ? { stem, extension: this.extensionOf(segment) }
      : undefined;
  }

  private extensionOf(segment: string): string | undefined {
    return this.split.test(segment)
      ? segment.replace(this.split, EXTENSION_ONLY).toLowerCase()
      : undefined;
  }

  private lastSegment(url: string): string {
    const parsed = URL.parse(url);
    return isWeb(parsed) ? lastPathPart(parsed.pathname) : NO_SEGMENT;
  }
}
