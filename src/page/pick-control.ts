// What a pick session offers the listeners it arms, what each of them is,
// and what they and the session ask of the rest of the page script.
import type { Listenable } from "./dom";

// Something that can stop waiting for the click, quietly.
export interface Disarmable {
  disarm(): void;
}

export interface Pickable {
  // The click the session was waiting for landed here.
  pick(x: number, y: number): void;
}

export interface Stoppable {
  // Stops waiting, and tells the service worker so.
  stop(): void;
}

// Everything the session offers its parts. Each part's own arm() takes only
// the piece of it that part uses, or nothing.
export interface PickControl extends Disarmable, Pickable, Stoppable {}

// One thing the session listens for while it waits. A new thing to listen for
// is a new part, not a change to the session.
export interface SessionPart {
  arm(control: PickControl): void;
}

// How the wait turns out: the click once it is in, or no click at all.
export interface PickFlow {
  pick(x: number, y: number): Promise<void>;
  cancel(): void;
}

// Adding a listener that is taken away again when the picker stops.
export interface Listening {
  listen(
    target: Listenable,
    type: string,
    listener: (event: never) => void,
  ): void;
}

// Taking every listener and undo away again.
export interface Clearing {
  clear(): void;
}

// How the click turned out, told to the service worker.
export interface PickReporter {
  picked(url: string, title: string): void;
  disarmed(): void;
  failed(error: string): void;
}

// Which presses and keys mean something to the picker, split by who asks.
export interface PickButton {
  // Whether a press of this mouse button is the one that picks.
  picksWith(button: number): boolean;
}

export interface CancelKey {
  // Whether this key stops the picker.
  cancelsWith(key: string): boolean;
}
