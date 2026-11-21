import type {
  BackgroundMessage,
  DISARMED,
  FAILED,
  SAVE,
  SCHEME,
} from "../shared/messages";
import type { CommandHandlers, Sender } from "../shared/routing";
import type { PickOutcomes } from "./picking";
import type { DeviceSchemeSink } from "./scheme-ports";
import { senderTab } from "./sender-tab";

type Message<T extends BackgroundMessage["type"]> = Extract<
  BackgroundMessage,
  { type: T }
>;

// What the page scripts and the offscreen document tell the service worker,
// each handed to the part that deals with it.
export class BackgroundCommands implements CommandHandlers<BackgroundMessage> {
  constructor(
    private readonly outcomes: PickOutcomes,
    private readonly schemeSink: DeviceSchemeSink,
  ) {}

  readonly save = (
    message: Message<typeof SAVE>,
    sender: Sender,
  ): Promise<void> =>
    this.outcomes.picked(senderTab(sender), message.url, message.title);

  readonly disarmed = (
    _message: Message<typeof DISARMED>,
    sender: Sender,
  ): Promise<void> => this.outcomes.disarmed(senderTab(sender));

  readonly failed = (
    message: Message<typeof FAILED>,
    sender: Sender,
  ): Promise<void> => this.outcomes.failed(senderTab(sender), message.error);

  readonly scheme = (message: Message<typeof SCHEME>): Promise<void> =>
    this.schemeSink.deviceIs(message.scheme);
}
