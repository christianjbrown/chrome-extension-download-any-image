import { PICKER_BLUE } from "../shared/brand-colours";
import { ARMED, ERROR, IDLE, type ButtonLook, type Look } from "./button-looks";

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

// Waiting for a click on the button.
export class IdleLook implements ButtonLook<typeof IDLE> {
  readonly state = IDLE;

  look(_message: string): Look {
    return { badge: NO_BADGE, colour: GREY, title: IDLE_TITLE };
  }
}

// Waiting for a click on an image.
export class ArmedLook implements ButtonLook<typeof ARMED> {
  readonly state = ARMED;

  look(_message: string): Look {
    return { badge: ARMED_BADGE, colour: PICKER_BLUE, title: ARMED_TITLE };
  }
}

// The last download failed, and why.
export class ErrorLook implements ButtonLook<typeof ERROR> {
  readonly state = ERROR;

  look(message: string): Look {
    return {
      badge: ERROR_BADGE,
      colour: RED,
      title: `${ERROR_TITLE_PREFIX}${message}`,
    };
  }
}
