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

describe("the service worker's commands", () => {
  it("hands each report from a page on with the tab it came from", async () => {
    const reports = outcomes();

    await new SaveCommand(reports).handle(
      { target: "background", type: "save", url: "https://x", title: "T" },
      fromTab,
    );
    await new DisarmedCommand(reports).handle(
      { target: "background", type: "disarmed" },
      fromTab,
    );
    await new FailedCommand(reports).handle(
      { target: "background", type: "failed", error: "no" },
      fromTab,
    );

    expect(reports.picked).toHaveBeenCalledWith(6, "https://x", "T");
    expect(reports.disarmed).toHaveBeenCalledWith(6);
    expect(reports.failed).toHaveBeenCalledWith(6, "no");
  });

  it("each answers its own type of message", () => {
    const reports = outcomes();
    const sink = { deviceIs: vi.fn() };

    expect(
      [
        new SaveCommand(reports),
        new DisarmedCommand(reports),
        new FailedCommand(reports),
        new SchemeCommand(sink),
      ].map(({ type }) => type),
    ).toEqual(["save", "disarmed", "failed", "scheme"]);
  });

  it("refuses a report from outside a tab", () => {
    expect(() =>
      new DisarmedCommand(outcomes()).handle(
        { target: "background", type: "disarmed" },
        {},
      ),
    ).toThrow("Only a page in a tab can pick an image");
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
