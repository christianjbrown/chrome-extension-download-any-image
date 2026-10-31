import { PendingNames } from "../../src/background/pending-names";

describe("PendingNames", () => {
  it("hands out the oldest request for an address, once", () => {
    const names = new PendingNames();
    const first = { url: "https://x/a.png", title: "One" };
    const second = { url: "https://x/a.png", title: "Two" };
    names.expect(first);
    names.expect(second);

    expect(names.take("https://x/a.png")).toBe(first);
    expect(names.take("https://x/a.png")).toBe(second);
    expect(names.take("https://x/a.png")).toBeUndefined();
  });

  it("forgets a request, and only that one", () => {
    const names = new PendingNames();
    const first = { url: "https://x/a.png", title: "One" };
    const second = { url: "https://x/a.png", title: "Two" };
    names.expect(first);
    names.expect(second);

    names.forget(first);
    names.forget(first);

    expect(names.take("https://x/a.png")).toBe(second);
  });
});
