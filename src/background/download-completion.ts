import { COMPLETE, IN_PROGRESS } from "./download-terms";

// What Chrome says when a download stops without giving a reason.
const INTERRUPTED_MESSAGE = "Download interrupted";

interface DownloadDelta {
  id: number;
  state?: { current?: string };
  error?: { current?: string };
}

type DeltaListener = (delta: DownloadDelta) => void;

export interface DownloadEvents {
  onChanged: {
    addListener(listener: DeltaListener): void;
    removeListener(listener: DeltaListener): void;
  };
}

export interface DownloadCompletion {
  // Settles once the file is written, or fails with Chrome's reason.
  finished(id: number): Promise<void>;
}

export class DownloadWatcher implements DownloadCompletion {
  constructor(private readonly downloads: DownloadEvents) {}

  finished(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const listener: DeltaListener = (delta) => {
        const state = delta.state?.current;
        if (delta.id !== id || state === undefined || state === IN_PROGRESS) {
          return;
        }
        this.downloads.onChanged.removeListener(listener);
        if (state === COMPLETE) {
          resolve();
          return;
        }
        reject(new Error(delta.error?.current ?? INTERRUPTED_MESSAGE));
      };
      this.downloads.onChanged.addListener(listener);
    });
  }
}
