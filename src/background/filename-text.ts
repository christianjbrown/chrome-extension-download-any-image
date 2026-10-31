// Page titles and server paths are somebody else's text, so nothing reaches a
// filename until it has been through one of these.

export function kebab(text: string): string {
  const words = text
    .normalize("NFKD")
    // Latin accents only (é to e); other scripts' marks, like Japanese ペ, recombine.
    .replace(/[̀-ͯ]/g, "")
    .normalize("NFC")
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((word) => word !== "");
  return trimEnds(words.join("-").slice(0, 80));
}

// Keeps letters, digits, spaces, dots, dashes and underscores. Everything else,
// path separators and control characters included, becomes a dash.
export function safeStem(text: string): string {
  const cleaned = text
    .normalize("NFC")
    .replace(/[^\p{L}\p{N} ._-]+/gu, "-")
    .replace(/-{2,}/g, "-");
  return trimEnds(trimEnds(cleaned).slice(0, 100));
}

// No leading dot (a hidden file) and no trailing dot, dash or space.
function trimEnds(text: string): string {
  const edge = (char: string | undefined): boolean =>
    char !== undefined && /[\s.-]/.test(char);
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
