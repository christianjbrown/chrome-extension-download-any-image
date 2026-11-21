import { ElementCheck } from "../../src/page/element-check";
import { ElementStyles } from "../../src/page/element-styles";
import { element } from "./fakes";

// Says yes to the fake elements a test makes, the way instanceof Element would.
const anyElement = new ElementCheck((_value): _value is Element => true);

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
