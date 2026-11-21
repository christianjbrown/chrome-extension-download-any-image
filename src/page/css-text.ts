// Just enough of CSS's syntax to read image values out of computed styles:
// brackets and quoted strings, so a comma or a bracket inside either is left alone.

export interface CssFunction {
  name: string;
  args: string;
}

const OPEN = "(";
const CLOSE = ")";
const COMMA = ",";
const ESCAPE = "\\";
const QUOTE_CHARS = ['"', "'"];
const QUOTES: ReadonlySet<string> = new Set(QUOTE_CHARS);
const ESCAPED_CHAR = /\\([\s\S])/g;
const WITHOUT_ESCAPE = "$1";

const IDENTIFIER = /[-\w]/;

// A quoted string at the start of the text, up to the first quote of its kind
// that is not escaped.
const LEADING_STRING = new RegExp(
  String.raw`^([${QUOTE_CHARS.join("")}])(?:\\[\s\S]|(?!\1)[^\\])*\1`,
);

// A quoted string is at least its two quotes.
const BARE_QUOTES = 2;

// Where the open bracket is before any has opened.
const NOT_OPEN = -1;

const isQuote = (char: string | undefined): char is string =>
  char !== undefined && QUOTES.has(char);

// Where the scanner is: outside any string, inside one, or just after an
// escape. Each character says whether it was outside quotes, and where the
// scanner is for the next one.
type Mode = (char: string) => Step;

interface Step {
  outside: boolean;
  next: Mode;
}

// The escaped character, and then back to where the escape was.
const escapedThen =
  (back: Mode): Mode =>
  () => ({ outside: false, next: back });

const plain: Mode = (char) => opened(char) ?? { outside: true, next: plain };

// An escape or a quote outside a string starts something to look past.
function opened(char: string): Step | undefined {
  return char === ESCAPE
    ? { outside: false, next: escapedThen(plain) }
    : openedString(char);
}

function openedString(char: string): Step | undefined {
  return isQuote(char) ? { outside: false, next: inString(char) } : undefined;
}

// Inside a string that the quote opened, until the same quote closes it.
function inString(quote: string): Mode {
  const mode: Mode = (char) =>
    char === ESCAPE
      ? { outside: false, next: escapedThen(mode) }
      : { outside: false, next: closedBy(char, quote, mode) };
  return mode;
}

const closedBy = (char: string, quote: string, mode: Mode): Mode =>
  char === quote ? plain : mode;

// How a bracket changes the depth: a closing one before it is visited, an
// opening one after.
interface DepthChange {
  before: number;
  after: number;
}

const NO_CHANGE: DepthChange = { before: 0, after: 0 };
const DEPTH_CHANGES: ReadonlyMap<string, DepthChange> = new Map([
  [CLOSE, { before: -1, after: 0 }],
  [OPEN, { before: 0, after: 1 }],
]);

type Visit = (char: string, index: number, depth: number) => void;

interface ScanState {
  mode: Mode;
  depth: number;
}

// Calls visit with each character that is outside quotes, and the bracket
// depth it sits at.
function scan(text: string, visit: Visit): void {
  const state: ScanState = { mode: plain, depth: 0 };
  Array.from(text).forEach((char, index) => {
    stepOver(state, char, index, visit);
  });
}

function stepOver(
  state: ScanState,
  char: string,
  index: number,
  visit: Visit,
): void {
  const { outside, next } = state.mode(char);
  state.mode = next;
  if (outside) {
    visitAtDepth(state, char, index, visit);
  }
}

function visitAtDepth(
  state: ScanState,
  char: string,
  index: number,
  visit: Visit,
): void {
  const change = DEPTH_CHANGES.get(char) ?? NO_CHANGE;
  state.depth += change.before;
  visit(char, index, state.depth);
  state.depth += change.after;
}

const atTopLevel = (char: string, depth: number, wanted: string): boolean =>
  char === wanted && depth === 0;

// "a, b(c, d), e" is three parts.
export function splitTopLevel(text: string): string[] {
  const parts: string[] = [];
  let start = 0;
  scan(text, (char, index, depth) => {
    if (atTopLevel(char, depth, COMMA)) {
      parts.push(text.slice(start, index));
      start = index + 1;
    }
  });
  parts.push(text.slice(start));
  return parts.map((part) => part.trim()).filter((part) => part !== "");
}

interface FunctionScan {
  text: string;
  open: number;
  found: CssFunction[];
}

// A bracket can only close at the top level after one opened there, so there
// is always an open bracket to close.
function closeFunction(functions: FunctionScan, index: number): void {
  functions.found.push({
    name: nameBefore(functions.text, functions.open).toLowerCase(),
    args: functions.text.slice(functions.open + 1, index),
  });
}

// What a bracket at the top level does to the functions being read.
const TOP_LEVEL_BRACKETS: ReadonlyMap<
  string,
  (functions: FunctionScan, index: number) => void
> = new Map([
  [
    OPEN,
    (functions, index) => {
      functions.open = index;
    },
  ],
  [CLOSE, closeFunction],
]);

function topLevelChar(
  functions: FunctionScan,
  char: string,
  index: number,
): void {
  TOP_LEVEL_BRACKETS.get(char)?.(functions, index);
}

// The functions at the top level of the text, in order, by lower-case name.
export function functionsIn(text: string): CssFunction[] {
  const functions: FunctionScan = { text, open: NOT_OPEN, found: [] };
  scan(text, (char, index, depth) => {
    if (depth === 0) {
      topLevelChar(functions, char, index);
    }
  });
  return functions.found;
}

// The identifier that ends where a bracket opens: "url" in "url(".
function nameBefore(text: string, end: number): string {
  return text.slice(end - identifierLength(text, end), end);
}

// Before the start of the text there is no character, which ends it too.
function identifierLength(text: string, end: number): number {
  let length = 0;
  while (IDENTIFIER.test(text.charAt(end - length - 1))) {
    length += 1;
  }
  return length;
}

const closesWith = (text: string, quote: string | undefined): boolean =>
  isQuote(quote) && text.endsWith(quote);

const isQuoted = (text: string): boolean =>
  text.length >= BARE_QUOTES && closesWith(text, text[0]);

const withoutQuotes = (text: string): string =>
  isQuoted(text) ? text.slice(1, -1) : text;

// A url()'s argument or a string, without its quotes or escapes.
export function unquote(text: string): string {
  return withoutQuotes(text.trim()).replace(ESCAPED_CHAR, WITHOUT_ESCAPE);
}

// The quoted string the text starts with, quotes and all.
export function leadingString(text: string): string | undefined {
  return LEADING_STRING.exec(text.trimStart())?.[0];
}
