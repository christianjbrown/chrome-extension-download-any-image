// Which presses and keys mean something to the picker.
export interface PickGestures {
  // Whether a press of this mouse button is the one that picks.
  picksWith(button: number): boolean;
  // Whether this key stops the picker.
  cancelsWith(key: string): boolean;
}

// The main button, which is the left one unless the person swapped them.
const MAIN_BUTTON = 0;
const CANCEL_KEY = "Escape";

export const PICK_GESTURES: PickGestures = {
  picksWith: (button) => button === MAIN_BUTTON,
  cancelsWith: (key) => key === CANCEL_KEY,
};
