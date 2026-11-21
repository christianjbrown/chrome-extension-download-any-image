import type { NameRules } from "./original-name";

// Settings for the service worker. Only its entry point reads them, and hands
// each one to the part that needs it.
export interface BackgroundConfig {
  // The longest title or error a page may send.
  maxMessageText: number;
  // The longest a page's title gets in a fallback filename.
  maxTitleLength: number;
  // The longest a name kept from the image's address gets.
  maxStemLength: number;
  // When a name from the image's address is worth keeping.
  originalNames: NameRules;
}

export const BACKGROUND_CONFIG: BackgroundConfig = {
  maxMessageText: 2000,
  maxTitleLength: 80,
  maxStemLength: 100,
  originalNames: {
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
  },
};
