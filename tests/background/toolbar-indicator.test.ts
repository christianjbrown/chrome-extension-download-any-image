import type { LookSet } from "../../src/background/button-looks";
import { ClosedTabAction } from "../../src/background/closed-tab-action";
import { ToolbarIndicator } from "../../src/background/toolbar-indicator";
import {
  ArmedLook,
  ErrorLook,
  IdleLook,
} from "../../src/background/toolbar-looks";

// The looks the service worker is wired with.
const TOOLBAR_LOOKS = {
  idle: new IdleLook(),
  armed: new ArmedLook(),
  error: new ErrorLook(),
} satisfies LookSet;

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

    await show(new ToolbarIndicator(toolbar, TOOLBAR_LOOKS));

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
      new ToolbarIndicator(
        new ClosedTabAction(toolbar),
        TOOLBAR_LOOKS,
      ).showIdle(3),
    ).resolves.toBeUndefined();
  });

  it("still reports any other failure", async () => {
    const toolbar = action();
    toolbar.setTitle.mockRejectedValue(new Error("Something else"));

    await expect(
      new ToolbarIndicator(
        new ClosedTabAction(toolbar),
        TOOLBAR_LOOKS,
      ).showIdle(3),
    ).rejects.toThrow("Something else");
  });
});

describe("ToolbarIndicator with looks of its own", () => {
  it("paints the look the table gives for each state", async () => {
    const toolbar = action();
    const look = <S extends string>(state: S, title?: string) => ({
      state,
      look: (message: string) => ({
        badge: "b",
        colour: "c",
        title: title ?? message,
      }),
    });
    const indicator = new ToolbarIndicator(toolbar, {
      idle: look("idle", "idle"),
      armed: look("armed", "armed"),
      error: look("error"),
    });

    await indicator.showArmed(1);
    await indicator.showError(1, "why");

    expect(toolbar.setTitle).toHaveBeenNthCalledWith(1, {
      tabId: 1,
      title: "armed",
    });
    expect(toolbar.setTitle).toHaveBeenNthCalledWith(2, {
      tabId: 1,
      title: "why",
    });
  });
});

// Checked by tsc: the set of looks has one for every state, under its own.
describe("LookSet", () => {
  it("refuses a set with a state left out", () => {
    const set = {
      idle: new IdleLook(),
      armed: new ArmedLook(),
      // @ts-expect-error error has no look
    } satisfies LookSet;

    expect(set).toBeDefined();
  });

  it("refuses a look under another state's name", () => {
    const set = {
      idle: new IdleLook(),
      // @ts-expect-error an error look cannot show armed
      armed: new ErrorLook(),
      error: new ErrorLook(),
    } satisfies LookSet;

    expect(set).toBeDefined();
  });
});
