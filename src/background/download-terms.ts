// Chrome's own words in the downloads API.

// A file of the same name already there gets a number added, rather than
// being overwritten or asking.
export const UNIQUIFY = "uniquify";

// The states a download reports that this extension acts on. The third,
// interrupted, is anything else.
export const IN_PROGRESS = "in_progress";
export const COMPLETE = "complete";

// Chromium ignores an answer to onDeterminingFilename only when its filename
// is empty and its conflict action is uniquify (DeterminerCallback in
// chrome/browser/extensions/api/downloads/downloads_api.cc). Any other empty
// answer, including suggest() with nothing, counts as naming the file "".
const NO_OPINION_FILENAME = "";
export const NO_OPINION = {
  filename: NO_OPINION_FILENAME,
  conflictAction: UNIQUIFY,
} as const;
