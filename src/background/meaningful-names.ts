import type { NameFilter } from "./name-filter";

// What makes a name from an address worth keeping.
export interface NameRules {
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
const CASE_INSENSITIVE = "i";

// A name with words in it, rather than a number, a hash or "image".
export class MeaningfulNames implements NameFilter {
  private readonly generic: ReadonlySet<string>;
  private readonly hash: RegExp;

  constructor(private readonly rules: NameRules) {
    this.generic = new Set(rules.generic);
    this.hash = new RegExp(
      `^[0-9a-f-]{${String(rules.minHashLength)},}$`,
      CASE_INSENSITIVE,
    );
  }

  keeps(stem: string): boolean {
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
}
