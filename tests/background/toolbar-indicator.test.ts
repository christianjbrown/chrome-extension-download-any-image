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

  it("ignores a tab that closed before its button could change", async () => {
    const toolbar = action();
    toolbar.setBadgeText.mockRejectedValue(new Error("No tab with id: 3."));

    await expect(
      new ToolbarIndicator(toolbar).showIdle(3),
    ).resolves.toBeUndefined();
  });

  it("still reports any other failure", async () => {
    const toolbar = action();
    toolbar.setTitle.mockRejectedValue(new Error("Something else"));

    await expect(new ToolbarIndicator(toolbar).showIdle(3)).rejects.toThrow(
      "Something else",
    );
  });
});
