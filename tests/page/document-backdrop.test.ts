import { DocumentBackdrop } from "../../src/page/document-backdrop";
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
