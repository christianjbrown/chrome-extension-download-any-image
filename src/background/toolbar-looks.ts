import { PICKER_BLUE } from "../shared/brand-colours";

// How the button looks: its badge, the badge's colour and its title.
interface Look {
  badge: string;
  colour: string;
  title: string;
}

// The states the button can show.
export const IDLE = "idle";
export const ARMED = "armed";
export const ERROR = "error";
export type ButtonState = typeof IDLE | typeof ARMED | typeof ERROR;

// The look for each state, from the message that goes with it. Only an error
// has one. A new state is a new row.
export type ToolbarLooks = Readonly<
  Record<ButtonState, (message: string) => Look>
>;

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

export const TOOLBAR_LOOKS: ToolbarLooks = {
  [IDLE]: () => ({ badge: NO_BADGE, colour: GREY, title: IDLE_TITLE }),
  [ARMED]: () => ({
    badge: ARMED_BADGE,
    colour: PICKER_BLUE,
    title: ARMED_TITLE,
  }),
  [ERROR]: (message) => ({
    badge: ERROR_BADGE,
    colour: RED,
    title: `${ERROR_TITLE_PREFIX}${message}`,
  }),
};
