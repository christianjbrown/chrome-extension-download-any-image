import { errorMessage } from "../shared/error-message";
import type { PickReporter } from "./background-client";
import type { Listenable } from "./dom";
import type { Bindings } from "./event-bindings";
import type { Hover } from "./hover-outline";
import type { Locator } from "./image-locator";
import type { ImageReading } from "./image-reading";
import type { PickGestures } from "./pick-gestures";

interface PointerLike {
  clientX: number;
  clientY: number;
  button: number;
  // False for a click the page's own script dispatched.
  isTrusted: boolean;
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
  gestures: PickGestures;
  locator: Locator;
  readers: ImageReading;
  reporter: PickReporter;
  title: () => string;
}

// The press that leads up to a click, which the page must not see either: a
// mousedown alone can start a drag, move focus or follow a link on some sites.
const PRESSES = ["pointerdown", "mousedown", "pointerup", "mouseup"];
const CLICK = "click";
const POINTER_MOVE = "pointermove";
const KEY_DOWN = "keydown";
const PAGE_HIDE = "pagehide";
const NAVIGATE = "navigate";

function swallow(event: Omit<KeyLike, "key">): void {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

// One frame's wait for the click. The click is the extension's, whatever it
// lands on: an image is saved, anything else simply stops the wait. Only a
// click the person made counts: one the page dispatched itself could choose
// what gets saved, so it passes through untouched and the wait goes on.
export class PickSession {
  constructor(private readonly deps: PickSessionDependencies) {}

  arm(): void {
    this.hidePresses();
    this.pickOnClick();
    this.outlineUnderPointer();
    this.stopOnCancelKey();
    this.stopWhenThePageGoes();
  }

  private hidePresses(): void {
    const { bindings, window, gestures } = this.deps;
    for (const type of PRESSES) {
      bindings.listen(window, type, (event: PointerLike) => {
        if (gestures.picksWith(event.button)) {
          swallow(event);
        }
      });
    }
  }

  private pickOnClick(): void {
    this.deps.bindings.listen(this.deps.window, CLICK, (event: PointerLike) => {
      if (!event.isTrusted) {
        return;
      }
      swallow(event);
      void this.pick(event.clientX, event.clientY);
    });
  }

  private outlineUnderPointer(): void {
    this.deps.bindings.listen(
      this.deps.window,
      POINTER_MOVE,
      (event: PointerLike) => {
        this.deps.hover.follow(event.clientX, event.clientY);
      },
    );
  }

  private stopOnCancelKey(): void {
    this.deps.bindings.listen(this.deps.window, KEY_DOWN, (event: KeyLike) => {
      if (this.deps.gestures.cancelsWith(event.key)) {
        swallow(event);
        this.stop();
      }
    });
  }

  // Leaving the page takes the picker with it, quietly, since the service
  // worker resets the button on a new page. An address change inside a
  // single-page app is reported, as nothing else would tell the button.
  private stopWhenThePageGoes(): void {
    const { bindings, window, navigation } = this.deps;
    bindings.listen(window, PAGE_HIDE, () => {
      this.disarm();
    });
    if (navigation !== undefined) {
      bindings.listen(navigation, NAVIGATE, () => {
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
