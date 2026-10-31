import { ImageSaver } from "../../src/background/image-saver";
import { PendingNames } from "../../src/background/pending-names";

describe("ImageSaver", () => {
  it("asks for a name before downloading, and waits for the file", async () => {
    const names = new PendingNames();
    let waiting: unknown;
    const downloads = {
      download: vi.fn(() => {
        waiting = names.take("https://x/cat.png");
        return Promise.resolve(12);
      }),
    };
    const completion = { finished: vi.fn().mockResolvedValue(undefined) };

    await new ImageSaver(downloads, names, completion).save(
      "https://x/cat.png",
      "Cats",
    );

    expect(waiting).toEqual({ url: "https://x/cat.png", title: "Cats" });
    expect(downloads.download).toHaveBeenCalledWith({
      url: "https://x/cat.png",
      saveAs: false,
      conflictAction: "uniquify",
    });
    expect(completion.finished).toHaveBeenCalledWith(12);
  });

  it("stops waiting for a name when Chrome refuses the download", async () => {
    const names = new PendingNames();
    const downloads = { download: vi.fn().mockRejectedValue(new Error("no")) };
    const completion = { finished: vi.fn() };

    await expect(
      new ImageSaver(downloads, names, completion).save("https://x/a.png", "A"),
    ).rejects.toThrow("no");
    expect(names.take("https://x/a.png")).toBeUndefined();
  });
});
