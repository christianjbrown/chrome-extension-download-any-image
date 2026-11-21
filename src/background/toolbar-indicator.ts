import { PICKER_BLUE } from "../shared/brand-colours";
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
const GREY = "#5a5a60";

// What the button says. The idle title is also the manifest's default_title,
// which a test keeps in step.
export const IDLE_TITLE = "Download next image I click on";
const ARMED_TITLE =
  "Click an image to download it, or click here again to stop";
const ERROR_TITLE_PREFIX = "Download failed: ";
const NO_BADGE = "";
const ARMED_BADGE = "ON";
const ERROR_BADGE = "!";

// How Chrome starts its refusal when the tab has gone.
const TAB_CLOSED_PREFIX = "No tab with id";

// Each tab has its own picker, so each tab's button has its own look.
export class ToolbarIndicator implements PickIndicator {
  constructor(private readonly action: ToolbarAction) {}

  showIdle(tabId: number): Promise<void> {
    return this.show(tabId, {
      badge: NO_BADGE,
      colour: GREY,
      title: IDLE_TITLE,
    });
  }

  showArmed(tabId: number): Promise<void> {
    return this.show(tabId, {
      badge: ARMED_BADGE,
      colour: PICKER_BLUE,
      title: ARMED_TITLE,
    });
  }

  showError(tabId: number, message: string): Promise<void> {
    return this.show(tabId, {
      badge: ERROR_BADGE,
      colour: RED,
      title: `${ERROR_TITLE_PREFIX}${message}`,
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
