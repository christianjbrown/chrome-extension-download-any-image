import type { SvgLike } from "../../src/page/dom";
import { ElementCheck } from "../../src/page/element-check";
import { XmlSvgSerializer } from "../../src/page/xml-svg-serializer";
import { element } from "./fakes";

// Says yes to the fake elements a test makes, the way instanceof Element would.
const anyElement = new ElementCheck((_value): _value is Element => true);

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
