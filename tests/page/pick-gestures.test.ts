import { PICK_GESTURES } from "../../src/page/pick-gestures";

describe("PICK_GESTURES", () => {
  it.each([
    [0, true],
    [1, false],
    [2, false],
  ])("picks with button %s: %s", (button, picks) => {
    expect(PICK_GESTURES.picksWith(button)).toBe(picks);
  });

  it.each([
    ["Escape", true],
    ["Enter", false],
  ])("stops on %s: %s", (key, cancels) => {
    expect(PICK_GESTURES.cancelsWith(key)).toBe(cancels);
  });
});
