import { errorMessage } from "../shared/error-message";
import type { PickReporter } from "./background-client";
import type { Listenable } from "./dom";
import type { Bindings } from "./event-bindings";
import type { Hover } from "./hover-outline";
import type { Locator } from "./image-locator";
import type { ImageReading } from "./image-readers";

interface PointerLike {
  clientX: number;
  clientY: number;
  button: number;
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
}

interface KeyLike {
  key: string;
  preventDefault(): void;
  stopPropagation(): void;
  stopImmediatePropagation(): void;
}

export interface PickSessionDependencies {
  bindings: Bindings;
  window: Listenable;
  // The Navigation API, which hears a single-page app change its address.
  navigation: Listenable | undefined;
  hover: Hover;
  locator: Locator;
  readers: ImageReading;
  reporter: PickReporter;
  title: () => string;
}

// The press that leads up to a click, which the page must not see either: a
// mousedown alone can start a drag, move focus or follow a link on some sites.
const PRESSES = ["pointerdown", "mousedown", "pointerup", "mouseup"];

function swallow(event: Omit<KeyLike, "key">): void {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

// One frame's wait for the click. The click is the extension's, whatever it
// lands on: an image is saved, anything else simply stops the wait.
export class PickSession {
  constructor(private readonly deps: PickSessionDependencies) {}

  arm(): void {
    const { bindings, window, navigation } = this.deps;
    for (const type of PRESSES) {
      bindings.listen(window, type, (event: PointerLike) => {
        if (event.button === 0) {
          swallow(event);
        }
      });
    }
    bindings.listen(window, "click", (event: PointerLike) => {
      swallow(event);
      void this.pick(event.clientX, event.clientY);
    });
    bindings.listen(window, "pointermove", (event: PointerLike) => {
      this.deps.hover.follow(event.clientX, event.clientY);
    });
    bindings.listen(window, "keydown", (event: KeyLike) => {
      if (event.key === "Escape") {
        swallow(event);
        this.stop();
      }
    });
    bindings.listen(window, "pagehide", () => {
      this.disarm();
    });
    if (navigation !== undefined) {
      bindings.listen(navigation, "navigate", () => {
        this.stop();
      });
    }
  }

  // Takes away everything arm() added. Safe to call more than once.
  disarm(): void {
    this.deps.bindings.clear();
    this.deps.hover.stop();
  }

  private stop(): void {
    this.disarm();
    this.deps.reporter.disarmed();
  }

  private async pick(x: number, y: number): Promise<void> {
    this.disarm();
    const found = this.deps.locator.locate(x, y);
    if (found === undefined) {
      this.deps.reporter.disarmed();
      return;
    }
    try {
      const url = await this.deps.readers.read(found.source);
      this.deps.reporter.picked(url, this.deps.title());
    } catch (error) {
      this.deps.reporter.failed(errorMessage(error));
    }
  }
}
