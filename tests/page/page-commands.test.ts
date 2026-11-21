import { FrameSlot, PageCommands } from "../../src/page/page-commands";

describe("PageCommands", () => {
  it("disarms the session, and says it worked", async () => {
    const session = { disarm: vi.fn() };
    const { disarm } = new PageCommands(session);

    await expect(disarm()).resolves.toBe(true);
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
});
