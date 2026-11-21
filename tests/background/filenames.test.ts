import { BACKGROUND_CONFIG } from "../../src/background/config";
import { MimeExtensions } from "../../src/background/file-extensions";
import { ImageFilenameChooser } from "../../src/background/filename-chooser";
import { kebab, safeStem } from "../../src/background/filename-text";
import { UrlOriginalNames } from "../../src/background/original-name";
import { SystemClock } from "../../src/background/system-clock";
import { TimestampedName } from "../../src/background/timestamped-name";

const clock = { now: () => new Date(2026, 9, 30, 14, 5) };
const rules = BACKGROUND_CONFIG.originalNames;

describe("kebab", () => {
  it.each([
    ["My Cool Page!", "my-cool-page"],
    ["Café déjà vu", "cafe-deja-vu"],
    ["ペーパー", "ペーパー"],
    ["  --  ", ""],
    ["a".repeat(79) + " b", "a".repeat(79)],
  ])("turns %s into %s", (text, expected) => {
    expect(kebab(text, 80)).toBe(expected);
  });
});

describe("safeStem", () => {
  it.each([
    ["My Photo", "My Photo"],
    ["../../etc/passwd", "etc-passwd"],
    ["a:b*c?d", "a-b-c-d"],
    [".hidden", "hidden"],
    ["trailing.  ", "trailing"],
    ["x".repeat(99) + "--y", "x".repeat(99)],
  ])("cleans %s into %s", (text, expected) => {
    expect(safeStem(text, 100)).toBe(expected);
  });
});

describe("UrlOriginalNames", () => {
  const names = new UrlOriginalNames(rules);

  it.each([
    ["https://x.com/a/sunset-over-sea.JPG?w=200", "sunset-over-sea", "jpg"],
    ["https://x.com/My%20Holiday%20Photo.png", "My Holiday Photo", "png"],
    ["https://x.com/images/kitten", "kitten", undefined],
    ["https://x.com/100%25-cotton.png", "100-cotton", "png"],
    ["https://x.com/bad%E0%A4name.png", "bad-E0-A4name", "png"],
  ])("keeps the name in %s", (url, stem, extension) => {
    expect(names.from(url)).toEqual({ stem, extension });
  });

  it.each([
    "https://x.com/12345678_98765432_n.jpg",
    "https://x.com/image.php?id=3",
    "https://x.com/IMG.png",
    "https://x.com/0f9a8b7c6d5e4f3a2b1c.webp",
    "https://x.com/AbCdEfGhIjKlMnOpQrStUvWx12",
    "https://x.com/",
    "data:image/png;base64,AAAA",
    "not a url",
  ])("finds nothing worth keeping in %s", (url) => {
    expect(names.from(url)).toBeUndefined();
  });

  it("follows the rules it is given", () => {
    const strict = new UrlOriginalNames({
      ...rules,
      maxStemLength: 4,
      maxExtensionLength: 3,
    });

    expect(
      new UrlOriginalNames({ ...rules, generic: ["kitten"] }).from(
        "https://x.com/kitten.png",
      ),
    ).toBeUndefined();
    expect(strict.from("https://x.com/sunset.png")).toEqual({
      stem: "suns",
      extension: "png",
    });
    expect(strict.from("https://x.com/sunset.webp")).toEqual({
      stem: "suns",
      extension: undefined,
    });
  });
});

describe("MimeExtensions", () => {
  const extensions = new MimeExtensions();

  it.each([
    ["image/jpeg", "png", "jpg"],
    ["image/svg+xml; charset=utf-8", undefined, "svg"],
    ["IMAGE/WEBP", undefined, "webp"],
    ["image/x-portable-pixmap", undefined, "portable-pixmap"],
    ["image/jpg", undefined, "jpg"],
    ["application/octet-stream", "gif", "gif"],
    [undefined, "png", "png"],
    [undefined, "jpeg", "jpeg"],
    ["application/octet-stream", "exe", "bin"],
    ["text/html", "html", "bin"],
    ["text/html", undefined, "bin"],
    ["constructor", undefined, "bin"],
  ])(
    "gives %s (address says %s) the extension %s",
    (mime, fromUrl, expected) => {
      expect(extensions.for(mime, fromUrl)).toBe(expected);
    },
  );
});

describe("TimestampedName", () => {
  it("puts the local date and time before the kebab-case title", () => {
    expect(new TimestampedName(clock, 80).name("My Cool Page")).toBe(
      "2026-10-30-14-05-my-cool-page",
    );
  });

  it("cuts a long title to the length it is given", () => {
    expect(new TimestampedName(clock, 5).name("My Cool Page")).toBe(
      "2026-10-30-14-05-my-co",
    );
  });

  it("falls back to image without a usable title", () => {
    expect(new TimestampedName(clock, 80).name("!!!")).toBe(
      "2026-10-30-14-05-image",
    );
  });
});

describe("SystemClock", () => {
  it("tells the time", () => {
    const before = Date.now();
    expect(new SystemClock().now().getTime()).toBeGreaterThanOrEqual(before);
  });
});

describe("ImageFilenameChooser", () => {
  const chooser = new ImageFilenameChooser(
    new UrlOriginalNames(rules),
    new TimestampedName(clock, 80),
    new MimeExtensions(),
  );

  it("keeps a meaningful name, with the extension the file really has", () => {
    expect(
      chooser.choose("https://x.com/sunset.jpg", "Page", "image/webp"),
    ).toBe("sunset.webp");
  });

  it("names a canvas or blob after the page and the time", () => {
    expect(
      chooser.choose("data:image/png;base64,AAAA", "My Page", "image/png"),
    ).toBe("2026-10-30-14-05-my-page.png");
  });
});
