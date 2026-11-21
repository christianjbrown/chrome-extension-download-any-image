import {
  DocumentBackdrop,
  DocumentOverlay,
  ElementCheck,
  ElementStyles,
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
  it("makes a div, readies it, then puts it on the root element", () => {
    const order: string[] = [];
    const made = { style: { setProperty: vi.fn() }, remove: vi.fn() };
    const document = {
      createElement: vi.fn(() => made),
      documentElement: { append: vi.fn(() => order.push("append")) },
    };
    const overlay = new DocumentOverlay(document);

    expect(
      overlay.add((element) => {
        order.push("ready");
        expect(element).toBe(made);
      }),
    ).toBe(made);

    expect(document.createElement).toHaveBeenCalledWith("div");
    expect(document.documentElement.append).toHaveBeenCalledWith(made);
    expect(order).toEqual(["ready", "append"]);
  });
});

// Says yes to the fake elements a test makes, the way instanceof Element would.
const anyElement = new ElementCheck((_value): _value is Element => true);

describe("ElementCheck", () => {
  it("hands back what really is an element", () => {
    const real = element("div");

    expect(anyElement.element(real)).toBe(real);
  });

  it("refuses anything else, as the browser would", () => {
    const check = new ElementCheck((_value): _value is Element => false);

    expect(() => check.element(element("div"))).toThrow(TypeError);
    expect(() => check.element(element("div"))).toThrow(
      "That is not an element on the page",
    );
  });
});

describe("ElementStyles", () => {
  it("asks the browser for the element's style, or a pseudo-element's", () => {
    const style = { getPropertyValue: () => "red" };
    const computed = vi.fn(() => style);
    const styles = new ElementStyles(anyElement, computed);
    const div = element("div");

    expect(styles.look(div, "::after")).toBe(style);
    expect(computed).toHaveBeenCalledWith(div, "::after");
  });
});

describe("XmlSvgSerializer", () => {
  it("writes the svg out as markup", () => {
    const svg = element("svg") as unknown as SvgLike;
    const writer = { serializeToString: vi.fn(() => "<svg/>") };

    expect(new XmlSvgSerializer(() => writer, anyElement).serialize(svg)).toBe(
      "<svg/>",
    );
    expect(writer.serializeToString).toHaveBeenCalledWith(svg);
  });
});
