import type { Listenable } from "./dom";

export interface Bindings {
  listen(
    target: Listenable,
    type: string,
    listener: (event: never) => void,
  ): void;
  // Anything else to undo when the picker stops.
  track(undo: () => void): void;
  clear(): void;
}

// Every listener the picker adds, in the capture phase so it hears the click
// before the page does, and the means to take all of them away again.
export class EventBindings implements Bindings {
  private undos: (() => void)[] = [];

  listen(
    target: Listenable,
    type: string,
    listener: (event: never) => void,
  ): void {
    const options = { capture: true };
    target.addEventListener(type, listener, options);
    this.track(() => {
      target.removeEventListener(type, listener, options);
    });
  }

  track(undo: () => void): void {
    this.undos.push(undo);
  }

  clear(): void {
    const undos = this.undos;
    this.undos = [];
    undos.forEach((undo) => {
      undo();
    });
  }
}
