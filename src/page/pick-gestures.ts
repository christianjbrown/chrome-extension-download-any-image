import type { CancelKey, PickButton } from "./pick-control";

// The main button, which is the left one unless the person swapped them.
const MAIN_BUTTON = 0;
const CANCEL_KEY = "Escape";

export const PICK_GESTURES: PickButton & CancelKey = {
  picksWith: (button) => button === MAIN_BUTTON,
  cancelsWith: (key) => key === CANCEL_KEY,
};
