import { ClosedTabAction } from "../../src/background/closed-tab-action";
import { ToolbarIndicator } from "../../src/background/toolbar-indicator";

function action() {
  return {
    setBadgeText: vi.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
    setTitle: vi.fn().mockResolvedValue(undefined),
  };
}

describe("ToolbarIndicator", () => {
  it.each([
    {
      show: (indicator: ToolbarIndicator) => indicator.showIdle(3),
      text: "",
      color: "#5a5a60",
      title: "Download next image I click on",
    },
    {
      show: (indicator: ToolbarIndicator) => indicator.showArmed(3),
      text: "ON",
      color: "#1a73e8",
      title: "Click an image to download it, or click here again to stop",
    },
    {
      show: (indicator: ToolbarIndicator) => indicator.showError(3, "no luck"),
      text: "!",
      color: "#dc2626",
      title: "Download failed: no luck",
    },
  ])("shows $title on that tab only", async ({ show, text, color, title }) => {
    const toolbar = action();

    await show(new ToolbarIndicator(toolbar));

    expect(toolbar.setBadgeText).toHaveBeenCalledWith({ tabId: 3, text });
    expect(toolbar.setBadgeBackgroundColor).toHaveBeenCalledWith({
      tabId: 3,
      color,
    });
    expect(toolbar.setTitle).toHaveBeenCalledWith({ tabId: 3, title });
  });
});

describe("ClosedTabAction", () => {
  it("passes each call through to the button", async () => {
    const toolbar = action();
    const closedTab = new ClosedTabAction(toolbar);

    await closedTab.setBadgeText({ tabId: 3, text: "ON" });
    await closedTab.setBadgeBackgroundColor({ tabId: 3, color: "#000000" });
    await closedTab.setTitle({ tabId: 3, title: "Hi" });

    expect(toolbar.setBadgeText).toHaveBeenCalledWith({ tabId: 3, text: "ON" });
    expect(toolbar.setBadgeBackgroundColor).toHaveBeenCalledWith({
      tabId: 3,
      color: "#000000",
    });
    expect(toolbar.setTitle).toHaveBeenCalledWith({ tabId: 3, title: "Hi" });
  });

  it("ignores a tab that closed before its button could change", async () => {
    const toolbar = action();
    toolbar.setBadgeText.mockRejectedValue(new Error("No tab with id: 3."));
    toolbar.setBadgeBackgroundColor.mockRejectedValue(
      new Error("No tab with id: 3."),
    );
    toolbar.setTitle.mockRejectedValue(new Error("No tab with id: 3."));

    await expect(
      new ToolbarIndicator(new ClosedTabAction(toolbar)).showIdle(3),
    ).resolves.toBeUndefined();
  });

  it("still reports any other failure", async () => {
    const toolbar = action();
    toolbar.setTitle.mockRejectedValue(new Error("Something else"));

    await expect(
      new ToolbarIndicator(new ClosedTabAction(toolbar)).showIdle(3),
    ).rejects.toThrow("Something else");
  });
});
