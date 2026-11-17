// The offscreen document: watches Chrome's colour scheme for the service worker.
import { DARK_SCHEME_QUERY, SchemeReporter } from "./scheme-reporter";

new SchemeReporter(
  window.matchMedia(DARK_SCHEME_QUERY),
  chrome.runtime,
  (work, everyMs) => {
    window.setInterval(work, everyMs);
  },
).start();
