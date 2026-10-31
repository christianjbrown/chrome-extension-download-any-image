import { HoverOutline } from "../../src/page/hover-outline";
import { OutlineBox } from "../../src/page/outline-box";
import { element } from "./fakes";

function overlay() {
  const values = new Map<string, string>();
  return {
    values,
    style: {
      setProperty: (name: string, value: string) => values.set(name, value),
    },
    remove: vi.fn(),
  };
}

describe("OutlineBox", () => {
  it("adds one frame over the box, moves it, and removes it", () => {
    const made = overlay();
    const create = vi.fn(() => made);
    const attach = vi.fn();
    const box = new OutlineBox(create, attach);

    box.show({ left: 1, top: 2, width: 3, height: 4 });
    box.show({ left: 5, top: 6, width: 7, height: 8 });

    expect(create).toHaveBeenCalledOnce();
    expect(attach).toHaveBeenCalledWith(made);
    expect(made.values.get("pointer-events")).toBe("none");
    expect(made.values.get("position")).toBe("fixed");
    expect(made.values.get("left")).toBe("5px");
    expect(made.values.get("height")).toBe("8px");

    box.hide();
    box.hide();
    expect(made.remove).toHaveBeenCalledOnce();
  });
});

describe("HoverOutline", () => {
  function setup(found = true) {
    const frames: (() => void)[] = [];
    const picture = element(
      "img",
      {},
      { left: 9, top: 9, width: 9, height: 9 },
    );
    const locator = {
      locate: vi.fn(() =>
        found
          ? { element: picture, source: { kind: "url" as const, url: "u" } }
          : undefined,
      ),
    };
    const outline = { show: vi.fn(), hide: vi.fn() };
    const hover = new HoverOutline(locator, outline, (callback) =>
      frames.push(callback),
    );
    return { frames, locator, outline, hover };
  }

  it("outlines what is under the latest point, once a frame", () => {
    const { frames, locator, outline, hover } = setup();

    hover.follow(1, 1);
    hover.follow(2, 2);
    expect(frames).toHaveLength(1);
    frames[0]!();

    expect(locator.locate).toHaveBeenCalledOnce();
    expect(locator.locate).toHaveBeenCalledWith(2, 2);
    expect(outline.show).toHaveBeenCalledWith({
      left: 9,
      top: 9,
      width: 9,
      height: 9,
    });
    hover.follow(3, 3);
    expect(frames).toHaveLength(2);
  });

  it("hides the outline over something that is not a picture", () => {
    const { frames, outline, hover } = setup(false);

    hover.follow(1, 1);
    frames[0]!();

    expect(outline.hide).toHaveBeenCalled();
    expect(outline.show).not.toHaveBeenCalled();
  });

  it("draws nothing more once stopped", () => {
    const { frames, locator, outline, hover } = setup();

    hover.follow(1, 1);
    hover.stop();
    frames[0]!();
    hover.follow(2, 2);

    expect(locator.locate).not.toHaveBeenCalled();
    expect(outline.hide).toHaveBeenCalled();
    expect(frames).toHaveLength(1);
  });
});
