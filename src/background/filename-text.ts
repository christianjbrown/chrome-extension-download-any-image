import type { TextCleaner } from "./text-cleaner";

// Page titles and server paths are somebody else's text, so nothing reaches a
// filename until it has been through one of these.

// Unicode's forms with accents split off a letter, and joined back on.
const DECOMPOSED = "NFKD";
const COMPOSED = "NFC";

// Accents Unicode splits off a Latin letter, and what joins the words.
const LATIN_MARKS = /[\u0300-\u036f]/g;
const NOT_A_WORD = /[^\p{L}\p{N}]+/u;
const DASH = "-";
const UNSAFE = /[^\p{L}\p{N} ._-]+/gu;
const DASHES = /-{2,}/g;
const EDGE = /[\s.-]/;

function kebab(text: string, maxLength: number): string {
  const words = text
    .normalize(DECOMPOSED)
    // Latin accents only (é to e); other scripts' marks, like Japanese ペ, recombine.
    .replace(LATIN_MARKS, "")
    .normalize(COMPOSED)
    .toLowerCase()
    .split(NOT_A_WORD)
    .filter((word) => word !== "");
  return trimEnds(words.join(DASH).slice(0, maxLength));
}

// Keeps letters, digits, spaces, dots, dashes and underscores. Everything else,
// path separators and control characters included, becomes a dash.
function safeStem(text: string, maxLength: number): string {
  const cleaned = text
    .normalize(COMPOSED)
    .replace(UNSAFE, DASH)
    .replace(DASHES, DASH);
  return trimEnds(trimEnds(cleaned).slice(0, maxLength));
}

// No leading dot (a hidden file) and no trailing dot, dash or space.
function trimEnds(text: string): string {
  const edge = (char: string | undefined): boolean =>
    char !== undefined && EDGE.test(char);
  let start = 0;
  let end = text.length;
  while (start < end && edge(text[start])) {
    start += 1;
  }
  while (end > start && edge(text[end - 1])) {
    end -= 1;
  }
  return text.slice(start, end);
}

// "my-cool-page": lower case words joined by dashes, cut to a length.
export class KebabText implements TextCleaner {
  constructor(private readonly maxLength: number) {}

  clean(text: string): string {
    return kebab(text, this.maxLength);
  }
}

// The text as it was, less anything a filename cannot hold, cut to a length.
export class SafeStemText implements TextCleaner {
  constructor(private readonly maxLength: number) {}

  clean(text: string): string {
    return safeStem(text, this.maxLength);
  }
}
