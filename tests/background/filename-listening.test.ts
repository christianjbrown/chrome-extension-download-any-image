import { FilenameListening } from "../../src/background/filename-listening";
import { fakeRegistry } from "./fakes";

function setup() {
  const event = fakeRegistry<() => void>();
  const listener = vi.fn();
  return { event, listener, listening: new FilenameListening(event, listener) };
}

describe("FilenameListening", () => {
  it("is not listening until something holds it", () => {
    const { event } = setup();

    expect(event.listeners).toEqual([]);
  });

  it("adds the listener on the first hold and takes it off on the last release", () => {
    const { event, listener, listening } = setup();

    listening.hold();
    expect(event.listeners).toEqual([listener]);

    listening.release();
    expect(event.listeners).toEqual([]);
  });

  it("keeps listening while overlapping holds are still out", () => {
    const { event, listener, listening } = setup();

    listening.hold();
    listening.hold();
    listening.release();

    expect(event.addListener).toHaveBeenCalledTimes(1);
    expect(event.listeners).toEqual([listener]);

    listening.release();
    expect(event.removeListener).toHaveBeenCalledTimes(1);
    expect(event.listeners).toEqual([]);
  });

  it("does nothing on a release with nothing held", () => {
    const { event, listener, listening } = setup();

    listening.release();
    listening.hold();

    expect(event.removeListener).not.toHaveBeenCalled();
    expect(event.listeners).toEqual([listener]);
  });
});
