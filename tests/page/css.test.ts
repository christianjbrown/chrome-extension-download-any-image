import { CssImageFinder } from "../../src/page/css-finder";
import { CssImageUrls } from "../../src/page/css-image-urls";
import {
  functionsIn,
  leadingString,
  splitTopLevel,
  unquote,
} from "../../src/page/css-text";
import { element, styles } from "./fakes";

describe("css text", () => {
  it("splits at top-level commas only", () => {
    expect(splitTopLevel('a, b(c, d), "e, f", , g\\,h')).toEqual([
      "a",
      "b(c, d)",
      '"e, f"',
      "g\\,h",
    ]);
  });

  it("lists the top-level functions", () => {
    expect(functionsIn('url("a(1).png") 2x, Image-Set(url(b) 1x) (x)')).toEqual(
      [
        { name: "url", args: '"a(1).png"' },
        { name: "image-set", args: "url(b) 1x" },
        { name: "", args: "x" },
      ],
    );
  });

  it("ignores a stray closing bracket", () => {
    expect(functionsIn(") url(a)")).toEqual([]);
  });

  it.each([
    ['"a.png"', "a.png"],
    ["'a.png'", "a.png"],
    ["  b.png  ", "b.png"],
    ['"a\\"b.png"', 'a"b.png'],
    ['"', '"'],
    ["\"a.png'", "\"a.png'"],
  ])("unquotes %s", (text, expected) => {
    expect(unquote(text)).toBe(expected);
  });

  it.each([
    [' "a\\"b" 2x', '"a\\"b"'],
    ["'c' 1x", "'c'"],
    ['"never closed', undefined],
    ["url(a) 1x", undefined],
  ])("reads the leading string of %s", (text, expected) => {
    expect(leadingString(text)).toBe(expected);
  });
});

describe("CssImageUrls", () => {
  const urls = new CssImageUrls();

  it.each([
    ['url("https://x/a.png")', "https://x/a.png"],
    [
      'linear-gradient(red, blue), url("https://x/top.png"), url("https://x/under.png")',
      "https://x/top.png",
    ],
    [
      'image-set(url("https://x/1.png") 1x, url("https://x/2.png") 2x)',
      "https://x/2.png",
    ],
    [
      '-webkit-image-set("https://x/hi.png" 192dpi, "https://x/lo.png" 96dpi)',
      "https://x/hi.png",
    ],
    [
      'image-set(url("https://x/c.png") 80dpcm, url("https://x/d.png") 1.5dppx)',
      "https://x/c.png",
    ],
    [
      'image-set(url("https://x/plain.png"), url("https://x/half.png") 0.5x)',
      "https://x/plain.png",
    ],
    [
      'image-set(url("https://x/t.avif") type("image/avif") 1x, junk 9x)',
      "https://x/t.avif",
    ],
    ['url("https://x/a.png") / "alt text"', "https://x/a.png"],
    ['url(""), url("https://x/b.png")', "https://x/b.png"],
    ["image-set(url(odd.png) 2.3.4x)", "odd.png"],
  ])("finds the picture in %s", (value, expected) => {
    expect(urls.first(value)).toBe(expected);
  });

  it.each([
    "none",
    "",
    "linear-gradient(red, blue)",
    "normal",
    '"just text"',
    "image-set(junk 1x)",
  ])("finds nothing in %s", (value) => {
    expect(urls.first(value)).toBeUndefined();
  });
});

describe("CssImageFinder", () => {
  const urls = new CssImageUrls();

  it("reads an element's own background", () => {
    const look = styles({
      "": { "background-image": 'url("https://x/bg.png")' },
    });

    expect(
      new CssImageFinder(look, urls, "background-image").find(element("div")),
    ).toEqual({ kind: "url", url: "https://x/bg.png" });
  });

  it("reads a pseudo-element that is drawn", () => {
    const look = styles({
      "::before": {
        content: '""',
        "background-image": 'url("https://x/b.png")',
      },
    });

    expect(
      new CssImageFinder(look, urls, "background-image", "::before").find(
        element("div"),
      ),
    ).toEqual({ kind: "url", url: "https://x/b.png" });
  });

  it.each(["none", "normal", ""])(
    "skips a pseudo-element whose content is %s, since it is not drawn",
    (content) => {
      const look = styles({
        "::after": { content, "background-image": 'url("https://x/b.png")' },
      });

      expect(
        new CssImageFinder(look, urls, "background-image", "::after").find(
          element("div"),
        ),
      ).toBeUndefined();
    },
  );

  it("finds nothing without a picture", () => {
    expect(
      new CssImageFinder(styles({}), urls, "mask-image").find(element("div")),
    ).toBeUndefined();
  });
});
