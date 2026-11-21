// Chrome's own words in the downloads API.

// A file of the same name already there gets a number added, rather than
// being overwritten or asking.
export const UNIQUIFY = "uniquify";

// The states a download reports that this extension acts on. The third,
// interrupted, is anything else.
export const IN_PROGRESS = "in_progress";
export const COMPLETE = "complete";
