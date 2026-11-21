import type {
  ARMED,
  ButtonKind,
  ButtonState,
  ERROR,
  IDLE,
} from "./button-states";

// What the toolbar button says about the picker in one tab, in any of the
// states its user names.
interface StateIndicator<K extends ButtonKind = ButtonKind> {
  show(tabId: number, state: ButtonState<K>): Promise<void>;
}

// Split by who needs which: a new page only puts it back to idle, an outcome
// is idle or an error, and only the toggle shows it armed.
export type IdleIndicator = StateIndicator<typeof IDLE>;
export type OutcomeIndicator = StateIndicator<typeof IDLE | typeof ERROR>;
export type PickIndicator = StateIndicator<
  typeof IDLE | typeof ERROR | typeof ARMED
>;
