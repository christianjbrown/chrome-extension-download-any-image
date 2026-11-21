import type { OriginalName, OriginalNames } from "./filename-ports";
import type { NameFilter } from "./name-filter";
import type { TextCleaner } from "./text-cleaner";

const WEB = /^https?:$/;
const PATH_SEPARATOR = "/";
const CASE_INSENSITIVE = "i";

// What an address with no path worth reading yields as its last part.
const NO_SEGMENT = "";

// Where the name and the extension sit in a match of the split pattern.
const STEM_GROUP = 1;
const EXTENSION_GROUP = 2;

function decoded(segment: string): string {
  try {
    return decodeURIComponent(segment);
  } catch {
    return segment;
  }
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
    const parts = this.split.exec(segment);
    const stem = this.stems.clean(parts?.at(STEM_GROUP) ?? segment);
    if (!this.filter.keeps(stem)) {
      return undefined;
    }
    return { stem, extension: parts?.at(EXTENSION_GROUP)?.toLowerCase() };
  }

  // Only a web address has a path worth reading. Bytes the page handed over
  // arrive as data: URLs, which have none.
  private lastSegment(url: string): string {
    const parsed = URL.parse(url);
    if (parsed === null || !WEB.test(parsed.protocol)) {
      return NO_SEGMENT;
    }
    const segments = parsed.pathname
      .split(PATH_SEPARATOR)
      .filter((part) => part !== "");
    return decoded(segments.at(-1) ?? NO_SEGMENT);
  }
}
