import { PageBlobs, type DataUrlReader } from "../../src/page/page-blobs";

function fileReader(outcome: "load" | "error") {
  const reader: DataUrlReader & { read: unknown } = {
    result: null,
    onload: null,
    onerror: null,
    read: undefined,
    readAsDataURL(blob) {
      reader.read = blob;
      if (outcome === "load") {
        (reader as { result: unknown }).result = "data:image/png;base64,AAAA";
        reader.onload?.();
      } else {
        reader.onerror?.();
      }
    },
  };
  return reader;
}

describe("PageBlobs", () => {
  it("fetches the blob behind a blob: URL", async () => {
    const blob = { size: 4 };
    const fetcher = vi
      .fn()
      .mockResolvedValue({ blob: () => Promise.resolve(blob) });

    const fetched = await new PageBlobs(fetcher, () =>
      fileReader("load"),
    ).fetch("blob:https://x.com/1");

    expect(fetcher).toHaveBeenCalledWith("blob:https://x.com/1");
    expect(fetched).toBe(blob);
  });

  it("reads a blob as a data: URL", async () => {
    const reader = fileReader("load");
    const blob = { size: 4 };

    const url = await new PageBlobs(vi.fn(), () => reader).toDataUrl(blob);

    expect(url).toBe("data:image/png;base64,AAAA");
    expect(reader.read).toBe(blob);
  });

  it("says so when the browser cannot read the blob", async () => {
    await expect(
      new PageBlobs(vi.fn(), () => fileReader("error")).toDataUrl({ size: 4 }),
    ).rejects.toThrow("The image could not be read");
  });
});
