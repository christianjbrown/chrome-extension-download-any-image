import { DisarmCommand, FrameSlot } from "../../src/page/page-commands";

describe("DisarmCommand", () => {
  it("disarms the session, and says it worked", async () => {
    const session = { disarm: vi.fn() };
    const command = new DisarmCommand(session);

    expect(command.type).toBe("disarm");
    await expect(command.handle()).resolves.toBe(true);
    expect(session.disarm).toHaveBeenCalledOnce();
  });
});

describe("FrameSlot", () => {
  it("disarms the session kept there before, and keeps the new one", () => {
    const store: Record<string, { disarm(): void } | undefined> = {};
    const slot = new FrameSlot(store, "key");
    const first = { disarm: vi.fn() };

    slot.clear();
    slot.keep(first);
    slot.clear();

    expect(first.disarm).toHaveBeenCalledOnce();
    expect(store.key).toBe(first);
  });

  it.each([{ disarm: "no" }, "session", null])(
    "leaves alone a slot the page filled with %o",
    (held) => {
      const slot = new FrameSlot({ key: held }, "key");

      expect(() => {
        slot.clear();
      }).not.toThrow();
    },
  );
});
