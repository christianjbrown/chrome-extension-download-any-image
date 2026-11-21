import {
  isKeyEvent,
  isPointerEvent,
  onlyWhen,
  type KeyFields,
  type PointerFields,
} from "./checks";
import type { Listenable } from "./dom";
import type { HoverFollow } from "./outlining";
import type {
  CancelKey,
  Disarmable,
  Listening,
  Pickable,
  PickButton,
  SessionPart,
  Stoppable,
} from "./pick-control";

// What a listener can do to stop the page from seeing an event.
type Swallowable = Pick<
  Event,
  "preventDefault" | "stopPropagation" | "stopImmediatePropagation"
>;

// An event's isTrusted is false for one the page's own script dispatched.
type PointerLike = Event & PointerFields;
type KeyLike = Event & KeyFields;

// The press that leads up to a click, which the page must not see either: a
// mousedown alone can start a drag, move focus or follow a link on some sites.
const PRESSES = ["pointerdown", "mousedown", "pointerup", "mouseup"];
const CLICK = "click";
const POINTER_MOVE = "pointermove";
const KEY_DOWN = "keydown";
const PAGE_HIDE = "pagehide";
const NAVIGATE = "navigate";

function swallow(event: Swallowable): void {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();
}

// Hides the presses of the picking button from the page.
export class PressShield implements SessionPart {
  constructor(
    private readonly listening: Listening,
    private readonly target: Listenable,
    private readonly button: PickButton,
  ) {}

  arm(): void {
    for (const type of PRESSES) {
      this.listening.listen(
        this.target,
        type,
        onlyWhen(isPointerEvent, (event: PointerLike) => {
          this.shield(event);
        }),
      );
    }
  }

  private shield(event: PointerLike): void {
    if (this.button.picksWith(event.button)) {
      swallow(event);
    }
  }
}

// The click is the extension's, whatever it lands on. Only a click the person
// made counts: one the page dispatched itself could choose what gets saved, so
// it passes through untouched and the wait goes on.
export class ClickPick implements SessionPart {
  constructor(
    private readonly listening: Listening,
    private readonly target: Listenable,
  ) {}

  arm(control: Pickable): void {
    this.listening.listen(
      this.target,
      CLICK,
      onlyWhen(isPointerEvent, (event: PointerLike) => {
        this.clicked(event, control);
      }),
    );
  }

  private clicked(event: PointerLike, control: Pickable): void {
    if (!event.isTrusted) {
      return;
    }
    swallow(event);
    control.pick(event.clientX, event.clientY);
  }
}

// Outlines what a click would pick, wherever the pointer goes.
export class PointerOutline implements SessionPart {
  constructor(
    private readonly listening: Listening,
    private readonly target: Listenable,
    private readonly hover: HoverFollow,
  ) {}

  arm(): void {
    this.listening.listen(
      this.target,
      POINTER_MOVE,
      onlyWhen(isPointerEvent, (event: PointerLike) => {
        this.hover.follow(event.clientX, event.clientY);
      }),
    );
  }
}

// The key that stops the picker, which the page does not see.
export class CancelOnKey implements SessionPart {
  constructor(
    private readonly listening: Listening,
    private readonly target: Listenable,
    private readonly key: CancelKey,
  ) {}

  arm(control: Stoppable): void {
    this.listening.listen(
      this.target,
      KEY_DOWN,
      onlyWhen(isKeyEvent, (event: KeyLike) => {
        this.pressed(event, control);
      }),
    );
  }

  private pressed(event: KeyLike, control: Stoppable): void {
    if (this.key.cancelsWith(event.key)) {
      swallow(event);
      control.stop();
    }
  }
}

// Leaving the page takes the picker with it, quietly, since the service worker
// resets the button on a new page.
export class StopOnPageHide implements SessionPart {
  constructor(
    private readonly listening: Listening,
    private readonly target: Listenable,
  ) {}

  arm(control: Disarmable): void {
    this.listening.listen(this.target, PAGE_HIDE, () => {
      control.disarm();
    });
  }
}

// An address change inside a single-page app is reported, as nothing else
// would tell the button. Heard through the Navigation API, where there is one.
export class StopOnNavigate implements SessionPart {
  constructor(
    private readonly listening: Listening,
    private readonly navigation: Listenable | undefined,
  ) {}

  arm(control: Stoppable): void {
    if (this.navigation === undefined) {
      return;
    }
    this.listening.listen(this.navigation, NAVIGATE, () => {
      control.stop();
    });
  }
}
