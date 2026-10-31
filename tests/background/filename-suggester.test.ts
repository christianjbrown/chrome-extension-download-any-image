import { FilenameSuggester } from "../../src/background/filename-suggester";
import { PendingNames } from "../../src/background/pending-names";

function setup() {
  const names = new PendingNames();
  const chooser = {
    choose: vi.fn(
      (url: string, title: string, mime: string | undefined) =>
        `${url}|${title}|${String(mime)}`,
    ),
  };
  return {
    names,
    chooser,
    suggester: new FilenameSuggester("me", names, chooser),
  };
}

describe("FilenameSuggester", () => {
  it("names its own download from the request and the type Chrome found", () => {
    const { names, suggester } = setup();
    names.expect({ url: "https://x/a.png", title: "A" });
    const suggest = vi.fn();

    suggester.suggest(
      { byExtensionId: "me", url: "https://x/a.png", mime: "image/webp" },
      suggest,
    );

    expect(suggest).toHaveBeenCalledWith({
      filename: "https://x/a.png|A|image/webp",
      conflictAction: "uniquify",
    });
  });

  it("finds a redirected download by where it ended up", () => {
    const { names, suggester } = setup();
    names.expect({ url: "https://cdn/a.png", title: "A" });
    const suggest = vi.fn();

    suggester.suggest(
      {
        byExtensionId: "me",
        url: "https://x/short",
        finalUrl: "https://cdn/a.png",
      },
      suggest,
    );

    expect(suggest).toHaveBeenCalledWith({
      filename: "https://cdn/a.png|A|undefined",
      conflictAction: "uniquify",
    });
  });

  it.each([
    ["someone else's", { byExtensionId: "them", url: "https://x/a.png" }],
    ["the browser's own", { url: "https://x/a.png" }],
    ["an unexpected", { byExtensionId: "me", url: "https://x/b.png" }],
    [
      "an unexpected redirected",
      {
        byExtensionId: "me",
        url: "https://x/b.png",
        finalUrl: "https://x/c.png",
      },
    ],
  ])("leaves %s download alone", (_whose, item) => {
    const { names, suggester } = setup();
    names.expect({ url: "https://x/a.png", title: "A" });
    const suggest = vi.fn();

    suggester.suggest(item, suggest);

    expect(suggest).not.toHaveBeenCalled();
  });
});
