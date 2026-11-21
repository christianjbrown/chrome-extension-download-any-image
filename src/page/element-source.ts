// The browser's own element behind a page port, for the browser functions that
// take nothing less.
export interface ElementSource {
  element<T extends object>(value: T): T & Element;
}
