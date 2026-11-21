// What the toolbar button can show, and what each state carries with it. A
// new state is one more name and one more line in StateFields here.
export const IDLE = "idle";
export const ARMED = "armed";
export const ERROR = "error";

// A state with nothing to say beyond itself, and so no reason.
interface Plain {
  reason?: never;
}

// What each state carries: only an error says why.
interface StateFields {
  [IDLE]: Plain;
  [ARMED]: Plain;
  [ERROR]: { reason: string };
}

export type ButtonKind = keyof StateFields;

// A state of one kind, or of any of several. Written as a map over the kinds
// so a look picked by kind takes that kind's state without a cast.
export type ButtonState<K extends ButtonKind = ButtonKind> = {
  [P in K]: { kind: P } & StateFields[P];
}[K];

export const IDLE_STATE: ButtonState<typeof IDLE> = { kind: IDLE };
export const ARMED_STATE: ButtonState<typeof ARMED> = { kind: ARMED };
