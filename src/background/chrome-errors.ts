import { errorMessage } from "../shared/error-message";
import type { ErrorExplainer } from "./picking";

// One of Chrome's refusals, and what to tell the person instead.
export interface Translation {
  pattern: RegExp;
  message: string;
}

const OWN_PAGES = "Chrome does not let extensions into its own pages";

export const CHROME_TRANSLATIONS: readonly Translation[] = [
  // Without the tabs permission Chrome hides its own pages' URLs from the
  // extension, so these only come to light when the injection is refused.
  { pattern: /^Cannot access a [a-z-]+:\/\/ URL/, message: OWN_PAGES },
  { pattern: /^Cannot access contents of url "chrome/, message: OWN_PAGES },
  {
    pattern: /extensions gallery cannot be scripted/,
    message: "Chrome does not let extensions into the Web Store",
  },
  {
    pattern: /^Cannot access contents of url "file:/,
    message:
      "Turn on Allow access to file URLs for this extension to use it on local files",
  },
  {
    pattern: /'activeTab' permission is required/,
    message: "Click the button on the tab itself, then pick the image",
  },
];

// Says what Chrome's terser refusals mean for the person who clicked. A new
// refusal is a new translation, not a change here.
export class ChromeErrorExplainer implements ErrorExplainer {
  constructor(private readonly translations: readonly Translation[]) {}

  explain(error: unknown): string {
    const message = errorMessage(error);
    return (
      this.translations.find(({ pattern }) => pattern.test(message))?.message ??
      message
    );
  }
}
