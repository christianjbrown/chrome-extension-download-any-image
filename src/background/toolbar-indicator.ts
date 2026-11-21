import { PICKER_BLUE } from "../shared/brand-colours";
import type { PickIndicator } from "./pick-indicator";
import type { ToolbarAction } from "./toolbar-action";

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

  private async show(tabId: number, look: Look): Promise<void> {
    await Promise.all([
      this.action.setBadgeText({ tabId, text: look.badge }),
      this.action.setBadgeBackgroundColor({ tabId, color: look.colour }),
      this.action.setTitle({ tabId, title: look.title }),
    ]);
  }
}
