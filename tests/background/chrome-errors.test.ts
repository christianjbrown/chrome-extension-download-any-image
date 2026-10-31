import { ChromeErrorExplainer } from "../../src/background/chrome-errors";

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
    expect(new ChromeErrorExplainer().explain(new Error(message))).toBe(
      explained,
    );
  });
});
