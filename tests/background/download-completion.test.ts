import { DownloadWatcher } from "../../src/background/download-completion";

type Listener = (delta: never) => void;

function events() {
  const listeners = new Set<Listener>();
  return {
    listeners,
    onChanged: {
      addListener: (listener: Listener) => listeners.add(listener),
      removeListener: (listener: Listener) => listeners.delete(listener),
    },
    fire: (delta: unknown) => {
      [...listeners].forEach((listener) => {
        listener(delta as never);
      });
    },
  };
}

describe("DownloadWatcher", () => {
  it("settles once its own download completes, and stops listening", async () => {
    const downloads = events();
    const done = new DownloadWatcher(downloads).finished(3);

    downloads.fire({ id: 2, state: { current: "complete" } });
    downloads.fire({ id: 3 });
    downloads.fire({ id: 3, state: { current: "in_progress" } });
    expect(downloads.listeners.size).toBe(1);
    downloads.fire({ id: 3, state: { current: "complete" } });

    await expect(done).resolves.toBeUndefined();
    expect(downloads.listeners.size).toBe(0);
  });

  it("fails with Chrome's reason when it is interrupted", async () => {
    const downloads = events();
    const done = new DownloadWatcher(downloads).finished(3);

    downloads.fire({
      id: 3,
      state: { current: "interrupted" },
      error: { current: "SERVER_FORBIDDEN" },
    });

    await expect(done).rejects.toThrow("SERVER_FORBIDDEN");
    expect(downloads.listeners.size).toBe(0);
  });

  it("fails with a plain reason when Chrome gives none", async () => {
    const downloads = events();
    const done = new DownloadWatcher(downloads).finished(3);

    downloads.fire({ id: 3, state: { current: "interrupted" } });

    await expect(done).rejects.toThrow("Download interrupted");
  });
});
