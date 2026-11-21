import type { ChromeRefusal } from "./refusal-ports";

// Without the tabs permission Chrome hides its own pages' URLs from the
// extension, so these only come to light when the injection is refused.
const OWN_PAGE_ERRORS = [
  /^Cannot access a [a-z-]+:\/\/ URL/,
  /^Cannot access contents of url "chrome/,
];
const WEB_STORE_ERROR = "extensions gallery cannot be scripted";
const FILE_URL_ERROR = 'Cannot access contents of url "file:';
const ACTIVE_TAB_ERROR = "'activeTab' permission is required";

// One of Chrome's own pages.
export class OwnPageRefusal implements ChromeRefusal {
  readonly explanation = "Chrome does not let extensions into its own pages";

  matches(message: string): boolean {
    return OWN_PAGE_ERRORS.some((pattern) => pattern.test(message));
  }
}

// The Chrome Web Store.
export class WebStoreRefusal implements ChromeRefusal {
  readonly explanation = "Chrome does not let extensions into the Web Store";

  matches(message: string): boolean {
    return message.includes(WEB_STORE_ERROR);
  }
}

// A local file, before the person has let the extension see those.
export class FileUrlRefusal implements ChromeRefusal {
  readonly explanation =
    "Turn on Allow access to file URLs for this extension to use it on local files";

  matches(message: string): boolean {
    return message.startsWith(FILE_URL_ERROR);
  }
}

// A click that did not come from the tab's own button.
export class ActiveTabRefusal implements ChromeRefusal {
  readonly explanation =
    "Click the button on the tab itself, then pick the image";

  matches(message: string): boolean {
    return message.includes(ACTIVE_TAB_ERROR);
  }
}
