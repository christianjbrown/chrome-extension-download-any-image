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
    return this.hasWords(stem) && this.saysSomething(stem);
  }

  private hasWords(stem: string): boolean {
    return (
      Array.from(stem.matchAll(LETTER)).length >= this.rules.minLetters &&
      !this.looksLikeToken(stem)
    );
  }

  private looksLikeToken(stem: string): boolean {
    return stem.length >= this.rules.minTokenLength && !SEPARATOR.test(stem);
  }

  private saysSomething(stem: string): boolean {
    return !this.generic.has(stem.toLowerCase()) && !this.hash.test(stem);
  }
}
