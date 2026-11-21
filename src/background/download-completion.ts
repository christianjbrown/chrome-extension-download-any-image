import { COMPLETE, IN_PROGRESS } from "./download-terms";
import type { DownloadCompletion } from "./picking";

// What Chrome says when a download stops without giving a reason.
const INTERRUPTED_MESSAGE = "Download interrupted";

interface DownloadDelta {
  id: number;
  state?: { current?: string };
  error?: { current?: string };
}

type DeltaListener = (delta: DownloadDelta) => void;

// How the promise for one download is settled.
interface Settling {
  resolve(): void;
  reject(error: Error): void;
}

const currentState = (delta: DownloadDelta): string | undefined =>
  delta.state?.current;

// A state the download stays in is not an answer yet.
const endState = (state: string | undefined): string | undefined =>
  state === IN_PROGRESS ? undefined : state;

const chromeReason = (delta: DownloadDelta): string | undefined =>
  delta.error?.current;

const reasonFor = (delta: DownloadDelta): string =>
  chromeReason(delta) ?? INTERRUPTED_MESSAGE;

function settle(state: string, delta: DownloadDelta, settling: Settling): void {
  if (state === COMPLETE) {
    settling.resolve();
    return;
  }
  settling.reject(new Error(reasonFor(delta)));
}

export interface DownloadEvents {
  onChanged: {
    addListener(listener: DeltaListener): void;
    removeListener(listener: DeltaListener): void;
  };
}

export class DownloadWatcher implements DownloadCompletion {
  constructor(private readonly downloads: DownloadEvents) {}

  finished(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const listener: DeltaListener = (delta) => {
        if (delta.id === id) {
          this.changed(delta, listener, { resolve, reject });
        }
      };
      this.downloads.onChanged.addListener(listener);
    });
  }

  private changed(
    delta: DownloadDelta,
    listener: DeltaListener,
    settling: Settling,
  ): void {
    const state = endState(currentState(delta));
    if (state !== undefined) {
      this.downloads.onChanged.removeListener(listener);
      settle(state, delta, settling);
    }
  }
}
