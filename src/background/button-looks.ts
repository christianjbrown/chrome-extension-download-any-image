// What the toolbar button's looks are made of.

// How the button looks: its badge, the badge's colour and its title.
export interface Look {
  badge: string;
  colour: string;
  title: string;
}

// The states the button can show.
export const IDLE = "idle";
export const ARMED = "armed";
export const ERROR = "error";
export type ButtonState = typeof IDLE | typeof ARMED | typeof ERROR;

// The look for one state, from the message that goes with it. Only an error
// has one.
export interface ButtonLook<S extends ButtonState = ButtonState> {
  readonly state: S;
  look(message: string): Look;
}

// Exactly one look for every state, each under its own state. The entry point
// builds its looks as one of these, so the compiler refuses a state with no
// look. A new state is a new look.
export type LookSet = {
  readonly [S in ButtonState]: ButtonLook<S>;
};
