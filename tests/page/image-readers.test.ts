import { CanvasReader } from "../../src/page/canvas-reader";
import { ImageReaders } from "../../src/page/image-readers";
import { SvgReader } from "../../src/page/svg-reader";
import {
  BlobUrlReader,
  PassThroughReader,
  UrlReaders,
} from "../../src/page/url-readers";
import { styles, svgElement } from "./fakes";
import type { SvgLike } from "../../src/page/dom";

describe("PassThroughReader", () => {
  it.each(["https://x/a.png", "HTTPS://x/a.png", "data:image/png;base64,AA"])(
    "passes %s straight through",
    async (address) => {
      await expect(new PassThroughReader().read(address)).resolves.toBe(
        address,
      );
    },
  );

  it.each(["blob:https://x/1", "file:///a.png"])(
    "says nothing about %s",
    (address) => {
      expect(new PassThroughReader().read(address)).toBeUndefined();
    },
  );
});

describe("BlobUrlReader", () => {
  it("reads the blob in the page and hands it over as a data: URL", async () => {
    const blob = { size: 3 };
    const blobs = {
      fetch: vi.fn().mockResolvedValue(blob),
      toDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,AAA"),
    };
    const reader = new BlobUrlReader(blobs);

    expect(reader.read("https://x/1")).toBeUndefined();
    await expect(reader.read("blob:https://x/1")).resolves.toBe(
      "data:image/png;base64,AAA",
    );
    expect(blobs.fetch).toHaveBeenCalledWith("blob:https://x/1");
    expect(blobs.toDataUrl).toHaveBeenCalledWith(blob);
  });

  it("says so when the page has revoked it", async () => {
    const reader = new BlobUrlReader({
      fetch: vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
      toDataUrl: vi.fn(),
    });

    await expect(reader.read("blob:https://x/1")).rejects.toThrow(
      "The page has already thrown that image away",
    );
  });
});

describe("UrlReaders", () => {
  it("uses the first reader that knows the address", async () => {
    const skipped = { read: vi.fn(() => undefined) };
    const readers = new UrlReaders([
      skipped,
      { read: () => Promise.resolve("data:x") },
      { read: () => Promise.resolve("never") },
    ]);

    await expect(readers.read({ kind: "url", url: "https://x" })).resolves.toBe(
      "data:x",
    );
    expect(skipped.read).toHaveBeenCalledWith("https://x");
  });

  it("refuses an address nothing can read", async () => {
    await expect(
      new UrlReaders([]).read({ kind: "url", url: "gopher.invalid" }),
    ).rejects.toThrow("That image's address is not one Chrome can download");
  });
});

describe("CanvasReader", () => {
  it("reads the canvas as a PNG", async () => {
    const toDataURL = vi.fn(() => "data:image/png;base64,CC");

    await expect(
      new CanvasReader().read({ kind: "canvas", canvas: { toDataURL } }),
    ).resolves.toBe("data:image/png;base64,CC");
    expect(toDataURL).toHaveBeenCalledWith("image/png");
  });

  it("explains a tainted canvas", async () => {
    const canvas = {
      toDataURL: () => {
        throw new Error("SecurityError");
      },
    };

    await expect(
      new CanvasReader().read({ kind: "canvas", canvas }),
    ).rejects.toThrow("That canvas has another site's picture on it");
  });
});

function fakeSvg(attributes: Record<string, string>) {
  const copy = {
    attributes: { ...attributes },
    colour: "",
    hasAttribute(name: string) {
      return Object.hasOwn(this.attributes, name);
    },
    setAttribute(name: string, value: string) {
      this.attributes[name] = value;
    },
    style: {
      setProperty: (_name: string, value: string) => {
        copy.colour = value;
      },
    },
  };
  const svg = svgElement("svg", {
    cloneNode: () => copy,
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 24, height: 16 }),
  }) as unknown as SvgLike;
  return { svg, copy };
}

describe("SvgReader", () => {
  const look = styles({ "": { color: "rgb(0, 170, 0)" } });

  it("serialises a copy, sized as on screen and in its current colour", async () => {
    const { svg, copy } = fakeSvg({});
    const reader = new SvgReader(
      {
        serialize: (node) =>
          `<svg ${JSON.stringify((node as unknown as typeof copy).attributes)}/>`,
      },
      look,
    );
    const read = await reader.read({ kind: "svg", svg });

    expect(decodeURIComponent(read)).toBe(
      'data:image/svg+xml;charset=utf-8,<svg {"width":"24","height":"16"}/>',
    );
    expect(copy.colour).toBe("rgb(0, 170, 0)");
  });

  it("keeps a size the svg already gives", async () => {
    const { svg, copy } = fakeSvg({ width: "100", height: "50" });

    await new SvgReader({ serialize: () => "<svg/>" }, look).read({
      kind: "svg",
      svg,
    });

    expect(copy.attributes).toEqual({ width: "100", height: "50" });
  });
});

describe("ImageReaders", () => {
  const byKind = () => ({
    url: { read: vi.fn().mockResolvedValue("from url") },
    canvas: { read: vi.fn().mockResolvedValue("from canvas") },
    svg: { read: vi.fn().mockResolvedValue("from svg") },
  });

  it("hands each picture to the reader for its kind", async () => {
    const readers = byKind();
    const source = { kind: "canvas" as const, canvas: { toDataURL: () => "" } };

    await expect(new ImageReaders(readers).read(source)).resolves.toBe(
      "from canvas",
    );
    expect(readers.canvas.read).toHaveBeenCalledWith(source);
    expect(readers.url.read).not.toHaveBeenCalled();
    expect(readers.svg.read).not.toHaveBeenCalled();
  });
});
