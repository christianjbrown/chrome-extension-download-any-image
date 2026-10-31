import type { PageElement } from "../../src/page/dom";
import { MediaHits, PointHits, StackHits } from "../../src/page/point-hits";
import { element } from "./fakes";

describe("StackHits", () => {
  it("lists the stack top first, with shadow insides ahead of their host", () => {
    const top = element("div");
    const shadow = {
      elementsFromPoint: (): PageElement[] => [inner, outsider, host],
    };
    const inner = element("img", { getRootNode: () => shadow });
    const outsider = element("span");
    const host = element("my-widget", { shadowRoot: shadow });
    const body = element("body");
    const hits = new StackHits(
      { elementsFromPoint: () => [top, host, body] },
      (candidate) => candidate === body,
    );

    expect(hits.at(1, 2)).toEqual([top, inner, host]);
  });
});

describe("MediaHits", () => {
  it("finds pictures by where they are, later ones first", () => {
    const query = vi.fn();
    const under = element(
      "img",
      {},
      { left: 0, top: 0, width: 100, height: 100 },
    );
    const over = element(
      "canvas",
      {},
      { left: 50, top: 50, width: 100, height: 100 },
    );
    const away = element(
      "svg",
      {},
      { left: 200, top: 0, width: 10, height: 10 },
    );
    query.mockReturnValue([under, over, away]);

    const hits = new MediaHits({ querySelectorAll: query }).at(60, 60);

    expect(hits).toEqual([over, under]);
    expect(query).toHaveBeenCalledWith(
      "img, svg, canvas, video, input[type=image]",
    );
  });

  it.each([
    [10, 50],
    [50, 10],
    [-1, 5],
    [5, -1],
  ])("leaves out a picture that ends before %s, %s", (x, y) => {
    const picture = element(
      "img",
      {},
      { left: 0, top: 0, width: 10, height: 10 },
    );

    expect(
      new MediaHits({ querySelectorAll: () => [picture] }).at(x, y),
    ).toEqual([]);
  });
});

describe("PointHits", () => {
  it("joins the sources in order, each element once", () => {
    const a = element("img");
    const b = element("div");

    const hits = new PointHits([{ at: () => [a, b] }, { at: () => [b, a] }]);

    expect(hits.at(0, 0)).toEqual([a, b]);
  });
});
