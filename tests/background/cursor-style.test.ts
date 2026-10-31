import { CrosshairCursor } from "../../src/background/cursor-style";

describe("CrosshairCursor", () => {
  const expected = {
    target: { tabId: 4, allFrames: true },
    css: "*, *::before, *::after { cursor: crosshair !important; }",
    origin: "USER",
  };

  it("adds a user style to every frame", async () => {
    const scripting = {
      insertCSS: vi.fn().mockResolvedValue(undefined),
      removeCSS: vi.fn().mockResolvedValue(undefined),
    };

    await new CrosshairCursor(scripting).show(4);

    expect(scripting.insertCSS).toHaveBeenCalledWith(expected);
  });

  it("takes the same style away again", async () => {
    const scripting = {
      insertCSS: vi.fn().mockResolvedValue(undefined),
      removeCSS: vi.fn().mockResolvedValue(undefined),
    };

    await new CrosshairCursor(scripting).hide(4);

    expect(scripting.removeCSS).toHaveBeenCalledWith(expected);
  });
});
