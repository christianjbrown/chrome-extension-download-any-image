// What a pick session offers the listeners it arms, and what each of them is.

export interface PickControl {
  // The click the session was waiting for landed here.
  pick(x: number, y: number): void;
  // Stops waiting, and tells the service worker so.
  stop(): void;
  // Stops waiting, quietly.
  disarm(): void;
}

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
