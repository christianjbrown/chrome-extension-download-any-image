import { DocumentOverlay } from "../../src/page/document-overlay";

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
