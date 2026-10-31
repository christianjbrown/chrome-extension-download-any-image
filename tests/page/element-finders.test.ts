import {
  CanvasFinder,
  ImgFinder,
  InlineSvgFinder,
  InputImageFinder,
  SvgImageFinder,
  VideoPosterFinder,
} from "../../src/page/element-finders";
import { element, svgElement } from "./fakes";

describe("ImgFinder", () => {
  it("prefers the picture the browser chose from srcset", () => {
    expect(
      new ImgFinder().find(
        element("img", {
          currentSrc: "https://x/2x.png",
          src: "https://x/1x.png",
        }),
      ),
    ).toEqual({ kind: "url", url: "https://x/2x.png" });
  });

  it("falls back to src before the picture has loaded", () => {
    expect(
      new ImgFinder().find(
        element("img", { currentSrc: "", src: "https://x/1x.png" }),
      ),
    ).toEqual({ kind: "url", url: "https://x/1x.png" });
  });

  it.each([
    element("img", { currentSrc: "", src: "" }),
    element("div"),
    svgElement("img"),
  ])(
    "finds nothing in an img without a picture or another element",
    (candidate) => {
      expect(new ImgFinder().find(candidate)).toBeUndefined();
    },
  );
});

describe("InputImageFinder", () => {
  it("reads an image button", () => {
    expect(
      new InputImageFinder().find(
        element("input", { type: "image", src: "https://x/b.png" }),
      ),
    ).toEqual({ kind: "url", url: "https://x/b.png" });
  });

  it.each([
    element("input", { type: "text", src: "" }),
    element("input", { type: "image" }),
    element("button"),
  ])("finds nothing in another input", (candidate) => {
    expect(new InputImageFinder().find(candidate)).toBeUndefined();
  });
});

describe("VideoPosterFinder", () => {
  it("reads the poster", () => {
    expect(
      new VideoPosterFinder().find(
        element("video", { poster: "https://x/p.jpg" }),
      ),
    ).toEqual({ kind: "url", url: "https://x/p.jpg" });
  });

  it.each([element("video", { poster: "" }), element("audio")])(
    "finds nothing without a poster",
    (candidate) => {
      expect(new VideoPosterFinder().find(candidate)).toBeUndefined();
    },
  );
});

describe("CanvasFinder", () => {
  it("hands over the canvas itself", () => {
    const canvas = element("canvas", { toDataURL: () => "" });

    expect(new CanvasFinder().find(canvas)).toEqual({ kind: "canvas", canvas });
  });

  it("finds nothing in anything else", () => {
    expect(new CanvasFinder().find(element("div"))).toBeUndefined();
  });
});

describe("SvgImageFinder", () => {
  const finder = new SvgImageFinder(() => "https://x.com/dir/page.html");

  it("resolves the href against the page", () => {
    expect(
      finder.find(svgElement("image", { href: { baseVal: "pics/a.png" } })),
    ).toEqual({ kind: "url", url: "https://x.com/dir/pics/a.png" });
  });

  it.each([
    svgElement("image", { href: { baseVal: "" } }),
    element("image", { href: { baseVal: "a.png" } }),
    svgElement("rect"),
  ])("finds nothing without an href or outside SVG", (candidate) => {
    expect(finder.find(candidate)).toBeUndefined();
  });
});

describe("InlineSvgFinder", () => {
  it("takes the outermost svg", () => {
    const svg = svgElement("svg", { ownerSVGElement: null });

    expect(new InlineSvgFinder().find(svg)).toEqual({ kind: "svg", svg });
  });

  it.each([
    svgElement("svg", { ownerSVGElement: {} }),
    element("svg", { ownerSVGElement: null }),
    svgElement("path", { ownerSVGElement: {} }),
  ])(
    "passes over a nested svg, an HTML impostor and the shapes",
    (candidate) => {
      expect(new InlineSvgFinder().find(candidate)).toBeUndefined();
    },
  );
});
