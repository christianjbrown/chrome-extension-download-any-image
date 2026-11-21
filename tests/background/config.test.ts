import { BACKGROUND_CONFIG } from "../../src/background/config";

describe("background config", () => {
  it("takes titles and errors of up to 2000 characters from a page", () => {
    expect(BACKGROUND_CONFIG.maxMessageText).toBe(2000);
  });

  it("keeps up to 80 characters of a page's title in a fallback name", () => {
    expect(BACKGROUND_CONFIG.maxTitleLength).toBe(80);
  });

  it("keeps an address's name by these rules", () => {
    expect(BACKGROUND_CONFIG.originalNames).toEqual({
      maxStemLength: 100,
      maxExtensionLength: 5,
      minLetters: 2,
      minHashLength: 16,
      minTokenLength: 24,
      generic: [
        "download",
        "default",
        "file",
        "image",
        "img",
        "index",
        "photo",
        "pic",
        "picture",
        "thumb",
        "thumbnail",
      ],
    });
  });
});
