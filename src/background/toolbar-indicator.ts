import { errorMessage } from "../shared/error-message";
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
const TAB_CLOSED_PREFIX = "No tab with id";

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

  // A tab can close while its button is being updated, and then there is no
  // button left to update.
  private async show(tabId: number, look: Look): Promise<void> {
    try {
      await Promise.all([
        this.action.setBadgeText({ tabId, text: look.badge }),
        this.action.setBadgeBackgroundColor({ tabId, color: look.colour }),
        this.action.setTitle({ tabId, title: look.title }),
      ]);
    } catch (error) {
      if (!errorMessage(error).startsWith(TAB_CLOSED_PREFIX)) {
        throw error;
      }
    }
  }
}
