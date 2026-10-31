import type { PickIndicator } from "./pick-indicator";

export interface ToolbarAction {
  setBadgeText(details: { tabId: number; text: string }): Promise<void>;
  setBadgeBackgroundColor(details: {
    tabId: number;
    color: string;
  }): Promise<void>;
  setTitle(details: { tabId: number; title: string }): Promise<void>;
}

interface Look {
  badge: string;
  colour: string;
  title: string;
}

const RED = "#dc2626";
const BLUE = "#1a73e8";
const GREY = "#5a5a60";

// Each tab has its own picker, so each tab's button has its own look.
export class ToolbarIndicator implements PickIndicator {
  constructor(private readonly action: ToolbarAction) {}

  showIdle(tabId: number): Promise<void> {
    return this.show(tabId, {
      badge: "",
      colour: GREY,
      title: "Download next image I click on",
    });
  }

  showArmed(tabId: number): Promise<void> {
    return this.show(tabId, {
      badge: "ON",
      colour: BLUE,
      title: "Click an image to download it, or click here again to stop",
    });
  }

  showError(tabId: number, message: string): Promise<void> {
    return this.show(tabId, {
      badge: "!",
      colour: RED,
      title: `Download failed: ${message}`,
    });
  }

  private async show(tabId: number, look: Look): Promise<void> {
    await Promise.all([
      this.action.setBadgeText({ tabId, text: look.badge }),
      this.action.setBadgeBackgroundColor({ tabId, color: look.colour }),
      this.action.setTitle({ tabId, title: look.title }),
    ]);
  }
}
