import { errorMessage } from "../../src/shared/error-message";
import { DisarmGuard } from "../../src/shared/disarm-message";
import { DisarmedGuard } from "../../src/shared/disarmed-message";
import { FailedGuard } from "../../src/shared/failed-message";
import { SaveGuard } from "../../src/shared/save-message";
import { SchemeGuard } from "../../src/shared/scheme-message";
import {
  isMessageFor,
  isMessageOf,
  isShortText,
} from "../../src/shared/message-checks";
import { isOkReply } from "../../src/shared/replies";

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

describe("isMessageOf", () => {
  it("accepts a message for the target of the type", () => {
    expect(
      isMessageOf({ target: "page", type: "disarm" }, "page", "disarm"),
    ).toBe(true);
  });

  it.each([
    { target: "page", type: "other" },
    { target: "background", type: "disarm" },
    "disarm",
    null,
  ])("refuses %o", (message) => {
    expect(isMessageOf(message, "page", "disarm")).toBe(false);
  });
});

describe("isOkReply", () => {
  it("believes a reply that went through", () => {
    expect(isOkReply({ ok: true, value: true })).toBe(true);
  });

  it.each([{ ok: false, error: "no" }, { ok: "yes" }, "ok", undefined])(
    "does not believe %o",
    (reply) => {
      expect(isOkReply(reply)).toBe(false);
    },
  );
});

describe("isShortText", () => {
  it("accepts text up to the limit", () => {
    expect(isShortText("ab", 2)).toBe(true);
  });

  it.each(["abc", 3, undefined])("refuses %o", (value) => {
    expect(isShortText(value, 2)).toBe(false);
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

  it.each([undefined, "disarm", { target: "page", type: "save" }])(
    "refuses %o",
    (message) => {
      expect(new DisarmGuard().admits(message)).toBe(false);
    },
  );
});

// A message for the service worker of the type, with the fields given.
function message(type: string, fields: Record<string, unknown> = {}) {
  return { target: "background", type, ...fields };
}

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
    expect(
      backgroundGuards.save.admits(message("save", { url, title: "Cats" })),
    ).toBe(true);
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
    expect(backgroundGuards.save.admits(message("save", { url, title }))).toBe(
      false,
    );
  });

  it("accepts a disarmed report", () => {
    expect(backgroundGuards.disarmed.admits(message("disarmed"))).toBe(true);
  });

  it.each(Object.entries(backgroundGuards))(
    "%s refuses what is not a message of its type",
    (_type, guard) => {
      expect(guard.admits(undefined)).toBe(false);
      expect(guard.admits("save")).toBe(false);
      expect(
        guard.admits(
          message("other", {
            url: "https://x/a.png",
            title: "",
            error: "",
            scheme: "dark",
          }),
        ),
      ).toBe(false);
      expect(guard.admits({ target: "page", type: guard.type })).toBe(false);
    },
  );

  it.each([
    ["a reason", "it broke", true],
    ["no reason", undefined, false],
    ["a novel", "x".repeat(2001), false],
  ])("checks a failure with %s", (_what, error, accepted) => {
    expect(backgroundGuards.failed.admits(message("failed", { error }))).toBe(
      accepted,
    );
  });

  it.each(["light", "dark"])("accepts a %s colour scheme", (scheme) => {
    expect(backgroundGuards.scheme.admits(message("scheme", { scheme }))).toBe(
      true,
    );
  });

  it.each(["sepia", 7, undefined])("refuses a %s colour scheme", (scheme) => {
    expect(backgroundGuards.scheme.admits(message("scheme", { scheme }))).toBe(
      false,
    );
  });
});
