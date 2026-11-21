import {
  BACKGROUND,
  DISARMED,
  FAILED,
  SAVE,
  type BackgroundMessage,
  type BackgroundMessenger,
} from "../shared/messages";

// How the click turned out, told to the service worker.
export interface PickReporter {
  picked(url: string, title: string): void;
  disarmed(): void;
  failed(error: string): void;
}

// Nobody waits for an answer: the service worker shows the outcome on the
// button, and a worker that is gone has nothing to show it on.
export class BackgroundClient implements PickReporter {
  constructor(private readonly channel: BackgroundMessenger) {}

  picked(url: string, title: string): void {
    this.send({ target: BACKGROUND, type: SAVE, url, title });
  }

  disarmed(): void {
    this.send({ target: BACKGROUND, type: DISARMED });
  }

  failed(error: string): void {
    this.send({ target: BACKGROUND, type: FAILED, error });
  }

  private send(message: BackgroundMessage): void {
    this.channel.sendMessage(message).catch(() => undefined);
  }
}
