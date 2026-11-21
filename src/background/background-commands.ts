import {
  DISARMED,
  FAILED,
  SAVE,
  SCHEME,
  type BackgroundMessage,
} from "../shared/messages";
import type { Command, Sender } from "../shared/routing";
import type { DisarmedOutcome, FailedOutcome, PickedOutcome } from "./picking";
import type { DeviceSchemeSink } from "./scheme-ports";
import { senderTab } from "./sender-tab";

type Message<T extends BackgroundMessage["type"]> = Extract<
  BackgroundMessage,
  { type: T }
>;

// What the page scripts and the offscreen document tell the service worker,
// one command per message, each handing it to the part that deals with it.

// The page picked an image, to be saved from the tab it came from.
export class SaveCommand implements Command<BackgroundMessage, typeof SAVE> {
  readonly type = SAVE;

  constructor(private readonly outcomes: PickedOutcome) {}

  handle(message: Message<typeof SAVE>, sender: Sender): Promise<void> {
    return this.outcomes.picked(senderTab(sender), message.url, message.title);
  }
}

// The page stopped waiting with nothing picked.
export class DisarmedCommand implements Command<
  BackgroundMessage,
  typeof DISARMED
> {
  readonly type = DISARMED;

  constructor(private readonly outcomes: DisarmedOutcome) {}

  handle(_message: Message<typeof DISARMED>, sender: Sender): Promise<void> {
    return this.outcomes.disarmed(senderTab(sender));
  }
}

// The page could not read the picture.
export class FailedCommand implements Command<
  BackgroundMessage,
  typeof FAILED
> {
  readonly type = FAILED;

  constructor(private readonly outcomes: FailedOutcome) {}

  handle(message: Message<typeof FAILED>, sender: Sender): Promise<void> {
    return this.outcomes.failed(senderTab(sender), message.error);
  }
}

// The offscreen document saw the device's colour scheme.
export class SchemeCommand implements Command<
  BackgroundMessage,
  typeof SCHEME
> {
  readonly type = SCHEME;

  constructor(private readonly sink: DeviceSchemeSink) {}

  handle(message: Message<typeof SCHEME>): Promise<void> {
    return this.sink.deviceIs(message.scheme);
  }
}
