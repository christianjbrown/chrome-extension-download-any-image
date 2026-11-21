import { DisarmedCommand } from "../../src/background/disarmed-command";
import { FailedCommand } from "../../src/background/failed-command";
import { SaveCommand } from "../../src/background/save-command";
import { SchemeCommand } from "../../src/background/scheme-command";

function outcomes() {
  return {
    picked: vi.fn().mockResolvedValue(undefined),
    disarmed: vi.fn().mockResolvedValue(undefined),
    failed: vi.fn().mockResolvedValue(undefined),
  };
}

const fromTab = { id: "ext", tab: { id: 6 } };

// Says every message came from tab 6, or refuses it as from outside a tab.
const tabs = { tabOf: vi.fn(() => 6) };
const noTab = {
  tabOf: () => {
    throw new Error("outside a tab");
  },
};

describe("the service worker's commands", () => {
  it("hands each report from a page on with the tab it came from", async () => {
    const reports = outcomes();

    await new SaveCommand(reports, tabs).handle(
      { target: "background", type: "save", url: "https://x", title: "T" },
      fromTab,
    );
    await new DisarmedCommand(reports, tabs).handle(
      { target: "background", type: "disarmed" },
      fromTab,
    );
    await new FailedCommand(reports, tabs).handle(
      { target: "background", type: "failed", error: "no" },
      fromTab,
    );

    expect(reports.picked).toHaveBeenCalledWith(6, "https://x", "T");
    expect(reports.disarmed).toHaveBeenCalledWith(6);
    expect(reports.failed).toHaveBeenCalledWith(6, "no");
    expect(tabs.tabOf).toHaveBeenCalledWith(fromTab);
  });

  it("each answers its own type of message", () => {
    const reports = outcomes();
    const sink = { deviceIs: vi.fn() };

    expect(
      [
        new SaveCommand(reports, tabs),
        new DisarmedCommand(reports, tabs),
        new FailedCommand(reports, tabs),
        new SchemeCommand(sink),
      ].map(({ type }) => type),
    ).toEqual(["save", "disarmed", "failed", "scheme"]);
  });

  it("refuses a report from outside a tab", () => {
    expect(() =>
      new DisarmedCommand(outcomes(), noTab).handle(
        { target: "background", type: "disarmed" },
        {},
      ),
    ).toThrow("outside a tab");
  });

  it("hands the device's scheme to the toolbar", async () => {
    const sink = { deviceIs: vi.fn().mockResolvedValue(undefined) };

    await new SchemeCommand(sink).handle({
      target: "background",
      type: "scheme",
      scheme: "light",
    });

    expect(sink.deviceIs).toHaveBeenCalledWith("light");
  });
});
