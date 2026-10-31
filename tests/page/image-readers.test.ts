import type { ImageSource, SvgLike } from "../../src/page/dom";
import {
  BlobUrlReader,
  CanvasReader,
  ImageReaders,
  PassThroughReader,
  SvgReader,
} from "../../src/page/image-readers";
import { styles, svgElement } from "./fakes";

const url = (address: string): ImageSource => ({ kind: "url", url: address });

describe("PassThroughReader", () => {
  it.each(["https://x/a.png", "HTTPS://x/a.png", "data:image/png;base64,AA"])(
    "passes %s straight through",
    async (address) => {
      const reader = new PassThroughReader();

      expect(reader.reads(url(address))).toBe(true);
      await expect(reader.read(url(address))).resolves.toBe(address);
    },
  );

  it.each([
    url("blob:https://x/1"),
    url("file:///a.png"),
    { kind: "canvas" as const, canvas: { toDataURL: () => "" } },
  ])("does not read %o", (source) => {
    expect(new PassThroughReader().reads(source)).toBe(false);
  });
});

describe("BlobUrlReader", () => {
  it("reads the blob in the page and hands it over as a data: URL", async () => {
    const blob = { size: 3 };
    const blobs = {
      fetch: vi.fn().mockResolvedValue(blob),
      toDataUrl: vi.fn().mockResolvedValue("data:image/png;base64,AAA"),
    };
    const reader = new BlobUrlReader(blobs);

    expect(reader.reads(url("blob:https://x/1"))).toBe(true);
    expect(reader.reads(url("https://x/1"))).toBe(false);
    await expect(reader.read(url("blob:https://x/1"))).resolves.toBe(
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

    await expect(reader.read(url("blob:https://x/1"))).rejects.toThrow(
      "The page has already thrown that image away",
    );
  });
});

describe("CanvasReader", () => {
  it("reads the canvas as a PNG", async () => {
    const toDataURL = vi.fn(() => "data:image/png;base64,CC");
    const source: ImageSource = { kind: "canvas", canvas: { toDataURL } };
    const reader = new CanvasReader();

    expect(reader.reads(source)).toBe(true);
    expect(reader.reads(url("https://x"))).toBe(false);
    await expect(reader.read(source)).resolves.toBe("data:image/png;base64,CC");
    expect(toDataURL).toHaveBeenCalledWith("image/png");
  });

  it("explains a tainted canvas", async () => {
    const source: ImageSource = {
      kind: "canvas",
      canvas: {
        toDataURL: () => {
          throw new Error("SecurityError");
        },
      },
    };

    await expect(new CanvasReader().read(source)).rejects.toThrow(
      "That canvas has another site's picture on it",
    );
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
      (node) =>
        `<svg ${JSON.stringify((node as unknown as typeof copy).attributes)}/>`,
      look,
    );
    const source: ImageSource = { kind: "svg", svg };

    expect(reader.reads(source)).toBe(true);
    expect(reader.reads(url("https://x"))).toBe(false);
    const read = await reader.read(source);

    expect(decodeURIComponent(read)).toBe(
      'data:image/svg+xml;charset=utf-8,<svg {"width":"24","height":"16"}/>',
    );
    expect(copy.colour).toBe("rgb(0, 170, 0)");
  });

  it("keeps a size the svg already gives", async () => {
    const { svg, copy } = fakeSvg({ width: "100", height: "50" });

    await new SvgReader(() => "<svg/>", look).read({ kind: "svg", svg });

    expect(copy.attributes).toEqual({ width: "100", height: "50" });
  });
});

describe("ImageReaders", () => {
  it("uses the first reader that knows the kind", async () => {
    const readers = new ImageReaders([
      { reads: () => false, read: vi.fn() },
      { reads: () => true, read: () => Promise.resolve("data:x") },
    ]);

    await expect(readers.read(url("https://x"))).resolves.toBe("data:x");
  });

  it("refuses an address nothing can read", async () => {
    await expect(
      new ImageReaders([]).read(url("gopher.invalid")),
    ).rejects.toThrow("That image's address is not one Chrome can download");
  });
});
