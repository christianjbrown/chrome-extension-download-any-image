import { ElementCheck } from "../../src/page/element-check";
import { element } from "./fakes";

describe("ElementCheck", () => {
  it("hands back what really is an element", () => {
    const real = element("div");

    expect(
      new ElementCheck((_value): _value is Element => true).element(real),
    ).toBe(real);
  });

  it("refuses anything else, as the browser would", () => {
    const check = new ElementCheck((_value): _value is Element => false);

    expect(() => check.element(element("div"))).toThrow(TypeError);
    expect(() => check.element(element("div"))).toThrow(
      "That is not an element on the page",
    );
  });
});
