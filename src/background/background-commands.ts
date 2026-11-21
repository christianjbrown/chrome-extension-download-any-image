import type { ColourScheme } from "../shared/colour-scheme";
import type { CommandHandlers, Sender } from "../shared/command-router";
import type {
  BackgroundMessage,
  DISARMED,
  FAILED,
  SAVE,
  SCHEME,
} from "../shared/messages";
import { senderTab } from "./sender-tab";

type Message<T extends BackgroundMessage["type"]> = Extract<
  BackgroundMessage,
  { type: T }
>;

// How a click in a tab turned out, as the page reports it.
export interface PickOutcomes {
  picked(tabId: number, url: string, title: string): Promise<void>;
  disarmed(tabId: number): Promise<void>;
  failed(tabId: number, error: string): Promise<void>;
}

// What the offscreen document reports.
export interface DeviceSchemeSink {
  deviceIs(scheme: ColourScheme): Promise<void>;
}

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
