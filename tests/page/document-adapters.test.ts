import {
  DocumentBackdrop,
  DocumentOverlay,
  XmlSvgSerializer,
} from "../../src/page/document-adapters";
import type { SvgLike } from "../../src/page/dom";
import { element } from "./fakes";

describe("DocumentBackdrop", () => {
  it("is the page's root and body, and nothing else", () => {
    const documentElement = element("html");
    const body = element("body");
    const backdrop = new DocumentBackdrop({ documentElement, body });

    expect(backdrop.isBackdrop(documentElement)).toBe(true);
    expect(backdrop.isBackdrop(body)).toBe(true);
    expect(backdrop.isBackdrop(element("div"))).toBe(false);
  });
});

describe("DocumentOverlay", () => {
  it("makes a div and puts it on the root element", () => {
    const made = { style: { setProperty: vi.fn() }, remove: vi.fn() };
    const document = {
      createElement: vi.fn(() => made),
      documentElement: { append: vi.fn() },
    };
    const overlay = new DocumentOverlay(document);

    expect(overlay.create()).toBe(made);
    overlay.attach(made);

    expect(document.createElement).toHaveBeenCalledWith("div");
    expect(document.documentElement.append).toHaveBeenCalledWith(made);
  });
});

describe("XmlSvgSerializer", () => {
  it("writes the svg out as markup", () => {
    const svg = element("svg") as unknown as SvgLike;
    const writer = { serializeToString: vi.fn(() => "<svg/>") };

    expect(new XmlSvgSerializer(() => writer).serialize(svg)).toBe("<svg/>");
    expect(writer.serializeToString).toHaveBeenCalledWith(svg);
  });
});
