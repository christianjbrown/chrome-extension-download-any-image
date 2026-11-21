// Turns somebody else's text, a page title or a server path, into something
// safe to put in a filename.
export interface TextCleaner {
  clean(text: string): string;
}
