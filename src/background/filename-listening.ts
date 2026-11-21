// An event a listener can be added to and taken off again, such as
// chrome.downloads.onDeterminingFilename.
export interface ListenerRegistry<Listener> {
  addListener(listener: Listener): void;
  removeListener(listener: Listener): void;
}

// Keeps a listener registered for as long as anything is holding it.
export interface ListenerHold {
  hold(): void;
  release(): void;
}

// Chrome asks every extension listening to onDeterminingFilename to name
// every download in the browser, and an extension's answer can clash with
// another's. So the listener is only there while one of this extension's own
// downloads is waiting for a name, and is taken off when the last one has
// been named. Holds are counted, so overlapping downloads share it.
export class FilenameListening<Listener> implements ListenerHold {
  private holds = 0;

  constructor(
    private readonly event: ListenerRegistry<Listener>,
    private readonly listener: Listener,
  ) {}

  hold(): void {
    if (this.holds === 0) {
      this.event.addListener(this.listener);
    }
    this.holds += 1;
  }

  release(): void {
    if (this.holds === 0) {
      return;
    }
    this.holds -= 1;
    if (this.holds === 0) {
      this.event.removeListener(this.listener);
    }
  }
}
