// Just enough of CSS's syntax to read image values out of computed styles:
// brackets and quoted strings, so a comma or a bracket inside either is left alone.

export interface CssFunction {
  name: string;
  args: string;
}

interface ScanState {
  depth: number;
  quote: string | undefined;
  escaped: boolean;
}

// Calls visit with each character that is outside quotes, and the bracket
// depth it sits at.
function scan(
  text: string,
  visit: (char: string, index: number, depth: number) => void,
): void {
  const state: ScanState = { depth: 0, quote: undefined, escaped: false };
  Array.from(text).forEach((char, index) => {
    if (inString(state, char)) {
      return;
    }
    if (char === ")") {
      state.depth -= 1;
    }
    visit(char, index, state.depth);
    if (char === "(") {
      state.depth += 1;
    }
  });
}

// Whether the character belongs to a quoted string (or an escape), updating
// the state as it goes.
function inString(state: ScanState, char: string): boolean {
  if (state.escaped) {
    state.escaped = false;
    return true;
  }
  if (char === "\\") {
    state.escaped = true;
    return true;
  }
  if (state.quote !== undefined) {
    state.quote = char === state.quote ? undefined : state.quote;
    return true;
  }
  if (char === '"' || char === "'") {
    state.quote = char;
    return true;
  }
  return false;
}

// "a, b(c, d), e" is three parts.
export function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let start = 0;
  scan(text, (char, index, depth) => {
    if (char === "," && depth === 0) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  });
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part !== "");
}

// The functions at the top level of the text, in order, by lower-case name.
export function functionsIn(text: string): CssFunction[] {
  const found: CssFunction[] = [];
  let open = -1;
  scan(text, (char, index, depth) => {
    if (char === "(" && depth === 0) {
      open = index;
    }
    if (char === ")" && depth === 0 && open !== -1) {
      found.push({
        name: nameBefore(text, open).toLowerCase(),
        args: text.slice(open + 1, index),
      });
      open = -1;
    }
  });
  return found;
}

// The identifier that ends where a bracket opens: "url" in "url(".
function nameBefore(text: string, end: number): string {
  let start = end;
  while (start > 0 && /[-\w]/.test(text.charAt(start - 1))) {
    start -= 1;
  }
  return text.slice(start, end);
}

// A url()'s argument or a string, without its quotes or escapes.
export function unquote(text: string): string {
  const trimmed = text.trim();
  const quote = trimmed[0];
  const quoted =
    trimmed.length >= 2 &&
    (quote === '"' || quote === "'") &&
    trimmed.endsWith(quote);
  const inner = quoted ? trimmed.slice(1, -1) : trimmed;
  return inner.replace(/\\([\s\S])/g, "$1");
}

// The quoted string the text starts with, quotes and all.
export function leadingString(text: string): string | undefined {
  const trimmed = text.trimStart();
  const quote = trimmed[0];
  if (quote !== '"' && quote !== "'") {
    return undefined;
  }
  for (let index = 1; index < trimmed.length; index += 1) {
    const char = trimmed[index];
    if (char === "\\") {
      index += 1;
    } else if (char === quote) {
      return trimmed.slice(0, index + 1);
    }
  }
  return undefined;
}
