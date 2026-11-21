import {
  fieldAt,
  hasMethods,
  instanceOf,
  isKeyEvent,
  isPointerEvent,
  onlyWhen,
  textAt,
} from "../../src/page/checks";

// A plain object standing in for an event the browser fired.
const event = (fields: Record<string, unknown>) => fields as unknown as Event;

describe("fieldAt", () => {
  it("follows a path of fields", () => {
    expect(fieldAt({ href: { baseVal: "a.png" } }, "href", "baseVal")).toBe(
      "a.png",
    );
  });

  it.each([[{ href: "a.png" }], [{}], [null], ["text"]])(
    "is undefined where the path runs out in %o",
    (value) => {
      expect(fieldAt(value, "href", "baseVal")).toBeUndefined();
    },
  );
});

describe("textAt", () => {
  it("reads text", () => {
    expect(textAt({ src: "a.png" }, "src")).toBe("a.png");
  });

  it.each([{ src: 7 }, { src: null }, {}])("reads %o as no text", (value) => {
    expect(textAt(value, "src")).toBe("");
  });
});

describe("hasMethods", () => {
  it("sees every method there", () => {
    expect(hasMethods({ a: vi.fn(), b: vi.fn() }, ["a", "b"])).toBe(true);
  });

  it.each([{ a: vi.fn() }, { a: vi.fn(), b: "b" }, null])(
    "sees one missing from %o",
    (value) => {
      expect(hasMethods(value, ["a", "b"])).toBe(false);
    },
  );
});

describe("event shapes", () => {
  it("knows a pointer event by its numbers", () => {
    expect(isPointerEvent(event({ clientX: 1, clientY: 2, button: 0 }))).toBe(
      true,
    );
    expect(isPointerEvent(event({ clientX: 1, clientY: 2 }))).toBe(false);
  });

  it("knows a key event by its key", () => {
    expect(isKeyEvent(event({ key: "Escape" }))).toBe(true);
    expect(isKeyEvent(event({ key: 27 }))).toBe(false);
  });
});

describe("onlyWhen", () => {
  it("hands on only the events of its shape", () => {
    const listener = vi.fn();
    const heard = onlyWhen(isKeyEvent, listener);
    const key = event({ key: "a" });

    heard(event({ clientX: 1 }));
    heard(key);

    expect(listener).toHaveBeenCalledOnce();
    expect(listener).toHaveBeenCalledWith(key);
  });
});

describe("instanceOf", () => {
  it("checks a value against the type", () => {
    class Thing {
      readonly name = "thing";
    }
    const isThing = instanceOf(Thing);

    expect(isThing(new Thing())).toBe(true);
    expect(isThing({})).toBe(false);
  });
});
