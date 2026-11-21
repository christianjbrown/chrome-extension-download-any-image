import { ChromeErrorExplainer } from "../../src/background/chrome-errors";
import {
  ActiveTabRefusal,
  FileUrlRefusal,
  OwnPageRefusal,
  WebStoreRefusal,
} from "../../src/background/chrome-refusals";

// The refusals the service worker is wired with.
const REFUSALS = [
  new OwnPageRefusal(),
  new WebStoreRefusal(),
  new FileUrlRefusal(),
  new ActiveTabRefusal(),
];

describe("ChromeErrorExplainer", () => {
  it.each([
    [
      "Cannot access a chrome:// URL",
      "Chrome does not let extensions into its own pages",
    ],
    [
      'Cannot access contents of url "chrome-extension://abc/x.html".',
      "Chrome does not let extensions into its own pages",
    ],
    [
      "The extensions gallery cannot be scripted.",
      "Chrome does not let extensions into the Web Store",
    ],
    [
      'Cannot access contents of url "file:///Users/me/a.html".',
      "Turn on Allow access to file URLs for this extension to use it on local files",
    ],
    [
      "Either the 'activeTab' permission is required, or host permissions",
      "Click the button on the tab itself, then pick the image",
    ],
    ["Something else", "Something else"],
  ])("explains %s", (message, explained) => {
    expect(new ChromeErrorExplainer(REFUSALS).explain(new Error(message))).toBe(
      explained,
    );
  });

  it("explains only by the refusals it is given", () => {
    const explainer = new ChromeErrorExplainer([
      {
        matches: (message: string) => message.startsWith("Nope"),
        explanation: "Try again",
      },
    ]);

    expect(explainer.explain(new Error("Nope, not today"))).toBe("Try again");
    expect(explainer.explain("Cannot access a chrome:// URL")).toBe(
      "Cannot access a chrome:// URL",
    );
  });
});
