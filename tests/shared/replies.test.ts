import { CommandRouter } from "../../src/shared/command-router";
import type { Sender } from "../../src/shared/routing";
import { TrustedMessages } from "../../src/shared/trusted-messages";
import { replyWhenDone } from "../../src/shared/replies";

describe("replyWhenDone", () => {
  it("answers with the value once the work succeeds", async () => {
    const reply = vi.fn();

    replyWhenDone(Promise.resolve(7), reply);

    await vi.waitFor(() => {
      expect(reply).toHaveBeenCalledWith({ ok: true, value: 7 });
    });
  });

  it("answers with the reason once the work fails", async () => {
    const reply = vi.fn();

    replyWhenDone(Promise.reject(new Error("nope")), reply);

    await vi.waitFor(() => {
      expect(reply).toHaveBeenCalledWith({ ok: false, error: "nope" });
    });
  });
});

type TestMessage =
  | { target: "here"; type: "double"; n: number }
  | { target: "here"; type: "fail" };

const ME = { id: "me" };

function router() {
  return new CommandRouter<TestMessage>(
    new TrustedMessages<TestMessage>(
      "here",
      [
        {
          type: "double",
          admits: (message): message is TestMessage & { type: "double" } =>
            typeof (message as { n?: unknown }).n === "number",
        },
        {
          type: "fail",
          admits: (_message): _message is TestMessage & { type: "fail" } =>
            true,
        },
      ],
      "me",
    ),
    [
      {
        type: "double",
        handle: (message: TestMessage & { type: "double" }, sender: Sender) =>
          Promise.resolve(message.n * 2 + (sender.tab?.id ?? 0)),
      },
      { type: "fail", handle: () => Promise.reject(new Error("failed")) },
    ],
  );
}

describe("CommandRouter", () => {
  it("runs the handler and answers with its value", async () => {
    const reply = vi.fn();

    const later = router().route(
      { target: "here", type: "double", n: 4 },
      ME,
      reply,
    );

    expect(later).toBe(true);
    await vi.waitFor(() => {
      expect(reply).toHaveBeenCalledWith({ ok: true, value: 8 });
    });
  });

  it("hands the handler the sender", async () => {
    const reply = vi.fn();

    router().route(
      { target: "here", type: "double", n: 4 },
      { id: "me", tab: { id: 100 } },
      reply,
    );

    await vi.waitFor(() => {
      expect(reply).toHaveBeenCalledWith({ ok: true, value: 108 });
    });
  });

  it("answers with the handler's error", async () => {
    const reply = vi.fn();

    router().route({ target: "here", type: "fail" }, ME, reply);

    await vi.waitFor(() => {
      expect(reply).toHaveBeenCalledWith({ ok: false, error: "failed" });
    });
  });

  it("ignores messages for another context", () => {
    const reply = vi.fn();

    expect(router().route({ target: "there", type: "double" }, ME, reply)).toBe(
      false,
    );
    expect(reply).not.toHaveBeenCalled();
  });

  it("ignores types it has no handler for", () => {
    const reply = vi.fn();

    expect(router().route({ target: "here", type: "other" }, ME, reply)).toBe(
      false,
    );
    expect(reply).not.toHaveBeenCalled();
  });

  it.each([
    ["another extension", { id: "them" }],
    ["a page with no id", {}],
    ["no sender", undefined],
  ])("ignores a message from %s", (_who, sender) => {
    const reply = vi.fn();

    expect(
      router().route({ target: "here", type: "fail" }, sender, reply),
    ).toBe(false);
    expect(reply).not.toHaveBeenCalled();
  });

  it.each(["constructor", "__proto__", "toString", 5, undefined])(
    "ignores the inherited or odd type %s",
    (type) => {
      expect(router().route({ target: "here", type }, ME, vi.fn())).toBe(false);
    },
  );

  it("ignores a message whose fields are the wrong type", () => {
    const reply = vi.fn();

    expect(
      router().route({ target: "here", type: "double", n: "4" }, ME, reply),
    ).toBe(false);
    expect(reply).not.toHaveBeenCalled();
  });
});

describe("CommandRouter with a gate of its own", () => {
  const commands = [
    {
      type: "fail" as const,
      handle: () => Promise.reject(new Error("failed")),
    },
  ];

  it("answers nothing the gate keeps out", () => {
    const asked: unknown[] = [];
    const gate = {
      admits: (message: unknown, sender: unknown): message is TestMessage => {
        asked.push(message, sender);
        return false;
      },
    };
    const router = new CommandRouter<TestMessage>(gate, commands);

    expect(router.route({ target: "here", type: "fail" }, ME, vi.fn())).toBe(
      false,
    );
    expect(asked).toEqual([{ target: "here", type: "fail" }, ME]);
  });

  it("answers nothing without a sender, whatever the gate says", () => {
    const gate = {
      admits: (_message: unknown): _message is TestMessage => true,
    };
    const router = new CommandRouter<TestMessage>(gate, commands);

    expect(
      router.route({ target: "here", type: "fail" }, undefined, vi.fn()),
    ).toBe(false);
  });

  it("answers nothing for a type it has no command for", () => {
    const gate = {
      admits: (_message: unknown): _message is TestMessage => true,
    };
    const router = new CommandRouter<TestMessage>(gate, commands);

    expect(router.route({ target: "here", type: "double" }, ME, vi.fn())).toBe(
      false,
    );
  });
});
