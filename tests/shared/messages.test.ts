import { errorMessage } from "../../src/shared/error-message";
import {
  DisarmGuard,
  DisarmedGuard,
  FailedGuard,
  SaveGuard,
  SchemeGuard,
} from "../../src/shared/message-guards";
import { isMessageFor } from "../../src/shared/messages";

describe("isMessageFor", () => {
  it("accepts a message addressed to the target", () => {
    expect(isMessageFor({ target: "page", type: "disarm" }, "page")).toBe(true);
  });

  it("rejects a message addressed elsewhere", () => {
    expect(isMessageFor({ target: "background", type: "x" }, "page")).toBe(
      false,
    );
  });

  it.each([null, undefined, "page", 42])("rejects %s", (message) => {
    expect(isMessageFor(message, "page")).toBe(false);
  });
});

describe("errorMessage", () => {
  it("uses an Error's message", () => {
    expect(errorMessage(new Error("boom"))).toBe("boom");
  });

  it("stringifies anything else", () => {
    expect(errorMessage("plain")).toBe("plain");
  });
});

describe("DisarmGuard", () => {
  it("accepts a disarm", () => {
    const guard = new DisarmGuard();

    expect(guard.type).toBe("disarm");
    expect(guard.admits({ target: "page", type: "disarm" })).toBe(true);
  });
});

describe("the background's guards", () => {
  const backgroundGuards = {
    save: new SaveGuard(2000),
    disarmed: new DisarmedGuard(),
    failed: new FailedGuard(2000),
    scheme: new SchemeGuard(),
  };

  it("each guard its own type", () => {
    for (const [type, guard] of Object.entries(backgroundGuards)) {
      expect(guard.type).toBe(type);
    }
  });

  it.each([
    "https://example.com/cat.png",
    "http://example.com/cat.png",
    "data:image/png;base64,AAAA",
    "DATA:image/svg+xml;charset=utf-8,%3Csvg%3E",
  ])("accepts a save of %s", (url) => {
    expect(backgroundGuards.save.admits({ url, title: "Cats" })).toBe(true);
  });

  it.each([
    ["javascript:alert(1)", "Cats"],
    ["data:text/html,<p>hi</p>", "Cats"],
    ["file:///etc/passwd", "Cats"],
    ["blob:https://example.com/1", "Cats"],
    [42, "Cats"],
    ["https://example.com/cat.png", 7],
    ["https://example.com/cat.png", "x".repeat(2001)],
  ])("refuses a save of %s titled %s", (url, title) => {
    expect(backgroundGuards.save.admits({ url, title })).toBe(false);
  });

  it("accepts a disarmed report", () => {
    expect(backgroundGuards.disarmed.admits({})).toBe(true);
  });

  it.each([
    ["a reason", "it broke", true],
    ["no reason", undefined, false],
    ["a novel", "x".repeat(2001), false],
  ])("checks a failure with %s", (_what, error, accepted) => {
    expect(backgroundGuards.failed.admits({ error })).toBe(accepted);
  });

  it.each(["light", "dark"])("accepts a %s colour scheme", (scheme) => {
    expect(backgroundGuards.scheme.admits({ scheme })).toBe(true);
  });

  it.each(["sepia", 7, undefined])("refuses a %s colour scheme", (scheme) => {
    expect(backgroundGuards.scheme.admits({ scheme })).toBe(false);
  });
});
