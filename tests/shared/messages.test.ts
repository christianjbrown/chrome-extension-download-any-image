import { errorMessage } from "../../src/shared/error-message";
import { backgroundGuards, pageGuards } from "../../src/shared/message-guards";
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

describe("pageGuards", () => {
  it("accepts a disarm", () => {
    expect(pageGuards.disarm({ target: "page", type: "disarm" })).toBe(true);
  });
});

describe("backgroundGuards", () => {
  it.each([
    "https://example.com/cat.png",
    "http://example.com/cat.png",
    "data:image/png;base64,AAAA",
    "DATA:image/svg+xml;charset=utf-8,%3Csvg%3E",
  ])("accepts a save of %s", (url) => {
    expect(backgroundGuards.save({ url, title: "Cats" })).toBe(true);
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
    expect(backgroundGuards.save({ url, title })).toBe(false);
  });

  it("accepts a disarmed report", () => {
    expect(backgroundGuards.disarmed({})).toBe(true);
  });

  it.each([
    ["a reason", "it broke", true],
    ["no reason", undefined, false],
    ["a novel", "x".repeat(2001), false],
  ])("checks a failure with %s", (_what, error, accepted) => {
    expect(backgroundGuards.failed({ error })).toBe(accepted);
  });
});
