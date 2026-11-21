import { DisarmCommand } from "../../src/page/disarm-command";

describe("DisarmCommand", () => {
  it("disarms the session, and says it worked", async () => {
    const session = { disarm: vi.fn() };
    const command = new DisarmCommand(session);

    expect(command.type).toBe("disarm");
    await expect(command.handle()).resolves.toBe(true);
    expect(session.disarm).toHaveBeenCalledOnce();
  });
});
