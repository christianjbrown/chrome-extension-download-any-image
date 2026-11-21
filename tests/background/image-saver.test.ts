import { FilenameListening } from "../../src/background/filename-listening";
import { ImageSaver } from "../../src/background/image-saver";
import { PendingNames } from "../../src/background/pending-names";
import { fakeRegistry } from "./fakes";

const URL = "https://x/cat.png";

function setup(download: () => Promise<number>) {
  const event = fakeRegistry<() => void>();
  const listener = vi.fn();
  const names = new PendingNames(new FilenameListening(event, listener));
  const downloads = { download: vi.fn(download) };
  const completion = { finished: vi.fn().mockResolvedValue(undefined) };
  return {
    event,
    listener,
    names,
    downloads,
    completion,
    saver: new ImageSaver(downloads, names, completion),
  };
}

describe("ImageSaver", () => {
  it("asks for a name before downloading, and waits for the file", async () => {
    let waiting: unknown;
    const { names, downloads, completion, saver } = setup(() => {
      names.take(URL, (request) => (waiting = request));
      return Promise.resolve(12);
    });

    await saver.save(URL, "Cats");

    expect(waiting).toEqual({ url: URL, title: "Cats" });
    expect(downloads.download).toHaveBeenCalledWith({
      url: URL,
      saveAs: false,
      conflictAction: "uniquify",
    });
    expect(completion.finished).toHaveBeenCalledWith(12);
  });

  it("is listening for the name before the download starts", async () => {
    let listening: unknown;
    const { event, listener, saver } = setup(() => {
      listening = [...event.listeners];
      return Promise.resolve(12);
    });

    await saver.save(URL, "Cats");

    expect(listening).toEqual([listener]);
  });

  it("stops listening once its download has been named", async () => {
    const { event, names, completion, saver } = setup(() => {
      names.take(URL, vi.fn());
      return Promise.resolve(12);
    });
    completion.finished.mockImplementation(() => {
      expect(event.listeners).toEqual([]);
      return Promise.resolve();
    });

    await saver.save(URL, "Cats");

    expect(completion.finished).toHaveBeenCalled();
    expect(event.removeListener).toHaveBeenCalledTimes(1);
  });

  it("stops listening when the download is never named", async () => {
    const { event, saver } = setup(() => Promise.resolve(12));

    await saver.save(URL, "Cats");

    expect(event.listeners).toEqual([]);
  });

  it("stops listening when the download fails", async () => {
    const { event, completion, saver } = setup(() => Promise.resolve(12));
    completion.finished.mockRejectedValue(new Error("interrupted"));

    await expect(saver.save(URL, "Cats")).rejects.toThrow("interrupted");
    expect(event.listeners).toEqual([]);
  });

  it("stops waiting for a name when Chrome refuses the download", async () => {
    const { event, names, saver } = setup(() =>
      Promise.reject(new Error("no")),
    );

    await expect(saver.save(URL, "Cats")).rejects.toThrow("no");
    expect(names.take(URL, vi.fn())).toBe(false);
    expect(event.listeners).toEqual([]);
  });

  it("stops waiting for a name when starting the download throws", async () => {
    const { event, saver } = setup(() => {
      throw new Error("bad url");
    });

    await expect(saver.save(URL, "Cats")).rejects.toThrow("bad url");
    expect(event.listeners).toEqual([]);
  });
});
