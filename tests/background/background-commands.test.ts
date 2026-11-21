import { BackgroundCommands } from "../../src/background/background-commands";

function setup() {
  const outcomes = {
    picked: vi.fn().mockResolvedValue(undefined),
    disarmed: vi.fn().mockResolvedValue(undefined),
    failed: vi.fn().mockResolvedValue(undefined),
  };
  const scheme = { deviceIs: vi.fn().mockResolvedValue(undefined) };
  return {
    outcomes,
    scheme,
    commands: new BackgroundCommands(outcomes, scheme),
  };
}

const fromTab = { id: "ext", tab: { id: 6 } };

describe("BackgroundCommands", () => {
  it("hands each report from a page on with the tab it came from", async () => {
    const { outcomes, commands } = setup();

    await commands.save(
      { target: "background", type: "save", url: "https://x", title: "T" },
      fromTab,
    );
    await commands.disarmed(
      { target: "background", type: "disarmed" },
      fromTab,
    );
    await commands.failed(
      { target: "background", type: "failed", error: "no" },
      fromTab,
    );

    expect(outcomes.picked).toHaveBeenCalledWith(6, "https://x", "T");
    expect(outcomes.disarmed).toHaveBeenCalledWith(6);
    expect(outcomes.failed).toHaveBeenCalledWith(6, "no");
  });

  it("refuses a report from outside a tab", () => {
    const { commands } = setup();

    expect(() =>
      commands.disarmed({ target: "background", type: "disarmed" }, {}),
    ).toThrow("Only a page in a tab can pick an image");
  });

  it("hands the device's scheme to the toolbar", async () => {
    const { scheme, commands } = setup();

    await commands.scheme({
      target: "background",
      type: "scheme",
      scheme: "light",
    });

    expect(scheme.deviceIs).toHaveBeenCalledWith("light");
  });
});
