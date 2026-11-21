import type { TextCleaner } from "./text-cleaner";

export interface OriginalName {
  stem: string;
  extension?: string | undefined;
}

export interface OriginalNames {
  // The image's own name from its address, when it has one worth keeping.
  from(url: string): OriginalName | undefined;
}

// What makes a name from an address worth keeping.
export interface NameRules {
  // The longest ending that counts as an extension rather than part of the name.
  maxExtensionLength: number;
  // Fewer letters than this is a number, not a name.
  minLetters: number;
  // A run of hex digits at least this long is a hash.
  minHashLength: number;
  // Unbroken text at least this long, with no space, dot, dash or underscore,
  // is a token.
  minTokenLength: number;
  // Names that say nothing about the picture, in lower case.
  generic: readonly string[];
}

// Separators a name made of words has, and a token does not.
const SEPARATOR = /[ ._-]/;
const LETTER = /\p{L}/gu;
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

export class UrlOriginalNames implements OriginalNames {
  private readonly generic: ReadonlySet<string>;
  private readonly hash: RegExp;
  private readonly split: RegExp;

  constructor(
    private readonly rules: NameRules,
    // Makes a name from the address safe to keep.
    private readonly stems: TextCleaner,
  ) {
    this.generic = new Set(rules.generic);
    this.hash = new RegExp(
      `^[0-9a-f-]{${String(rules.minHashLength)},}$`,
      CASE_INSENSITIVE,
    );
    this.split = new RegExp(
      `^(.+)\\.([a-z0-9]{1,${String(rules.maxExtensionLength)}})$`,
      CASE_INSENSITIVE,
    );
  }

  from(url: string): OriginalName | undefined {
    const segment = this.lastSegment(url);
    const parts = this.split.exec(segment);
    const stem = this.stems.clean(parts?.at(STEM_GROUP) ?? segment);
    if (!this.meaningful(stem)) {
      return undefined;
    }
    return { stem, extension: parts?.at(EXTENSION_GROUP)?.toLowerCase() };
  }

  // A name with words in it, rather than a number, a hash or "image".
  private meaningful(stem: string): boolean {
    const letters = stem.match(LETTER)?.length ?? 0;
    const looksLikeToken =
      stem.length >= this.rules.minTokenLength && !SEPARATOR.test(stem);
    return (
      letters >= this.rules.minLetters &&
      !this.generic.has(stem.toLowerCase()) &&
      !this.hash.test(stem) &&
      !looksLikeToken
    );
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
