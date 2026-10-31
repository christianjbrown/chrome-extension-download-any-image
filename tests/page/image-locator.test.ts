import { ImageLocator } from "../../src/page/image-locator";
import { element } from "./fakes";

describe("ImageLocator", () => {
  it("returns the topmost element any finder recognises", () => {
    const text = element("p");
    const picture = element("img");
    const background = element("div");
    const locator = new ImageLocator(
      { at: () => [text, picture, background] },
      [
        {
          find: (candidate) =>
            candidate === background ? { kind: "url", url: "b" } : undefined,
        },
        {
          find: (candidate) =>
            candidate === picture ? { kind: "url", url: "p" } : undefined,
        },
      ],
    );

    expect(locator.locate(0, 0)).toEqual({
      element: picture,
      source: { kind: "url", url: "p" },
    });
  });

  it("finds nothing where there is no picture", () => {
    const locator = new ImageLocator({ at: () => [element("p")] }, [
      { find: () => undefined },
    ]);

    expect(locator.locate(0, 0)).toBeUndefined();
  });
});
