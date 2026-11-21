import { FrameSlot } from "../../src/page/frame-slot";

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
