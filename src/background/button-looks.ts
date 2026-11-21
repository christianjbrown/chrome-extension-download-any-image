// What the toolbar button's looks are made of.
import type { ButtonKind, ButtonState } from "./button-states";

// How the button looks: its badge, the badge's colour and its title.
export interface Look {
  badge: string;
  colour: string;
  title: string;
}

// The look for one kind of state, from the state itself. A look whose state
// carries nothing is free to take nothing.
export interface ButtonLook<K extends ButtonKind = ButtonKind> {
  readonly kind: K;
  look(state: ButtonState<K>): Look;
}

// Exactly one look for every state, each under its own kind. The entry point
// builds its looks as one of these, so the compiler refuses a state with no
// look. A new state is a new look.
export type LookSet = {
  readonly [K in ButtonKind]: ButtonLook<K>;
};
