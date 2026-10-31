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
        if (delta.id !== id || state === undefined || state === "in_progress") {
          return;
        }
        this.downloads.onChanged.removeListener(listener);
        if (state === "complete") {
          resolve();
          return;
        }
        reject(new Error(delta.error?.current ?? "Download interrupted"));
      };
      this.downloads.onChanged.addListener(listener);
    });
  }
}
