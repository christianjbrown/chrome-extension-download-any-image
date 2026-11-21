import { PendingNames } from "../../src/background/pending-names";
import { fakeHold } from "./fakes";

const URL = "https://x/a.png";

describe("PendingNames", () => {
  it("hands out the oldest request for an address, once", () => {
    const names = new PendingNames(fakeHold());
    const first = { url: URL, title: "One" };
    const second = { url: URL, title: "Two" };
    names.expect(first);
    names.expect(second);
    const answer = vi.fn();

    expect(names.take(URL, answer)).toBe(true);
    expect(names.take(URL, answer)).toBe(true);
    expect(names.take(URL, answer)).toBe(false);
    expect(answer.mock.calls).toEqual([[first], [second]]);
  });

  it("forgets a request, and only that one", () => {
    const names = new PendingNames(fakeHold());
    const first = { url: URL, title: "One" };
    const second = { url: URL, title: "Two" };
    names.expect(first);
    names.expect(second);

    names.forget(first);
    names.forget(first);
    const answer = vi.fn();

    expect(names.take(URL, answer)).toBe(true);
    expect(answer).toHaveBeenCalledWith(second);
  });

  it("holds the listener for each request it is waiting on", () => {
    const hold = fakeHold();
    const names = new PendingNames(hold);

    names.expect({ url: URL, title: "One" });
    names.expect({ url: URL, title: "Two" });

    expect(hold.hold).toHaveBeenCalledTimes(2);
    expect(hold.release).not.toHaveBeenCalled();
  });

  it("lets go once a request is answered, after the answer", () => {
    const hold = fakeHold();
    const names = new PendingNames(hold);
    const request = { url: URL, title: "One" };
    names.expect(request);
    const answer = vi.fn(() => {
      expect(hold.release).not.toHaveBeenCalled();
    });

    names.take(URL, answer);
    names.forget(request);

    expect(answer).toHaveBeenCalled();
    expect(hold.release).toHaveBeenCalledTimes(1);
  });

  it("lets go even when the answer throws", () => {
    const hold = fakeHold();
    const names = new PendingNames(hold);
    names.expect({ url: URL, title: "One" });

    expect(() =>
      names.take(URL, () => {
        throw new Error("no");
      }),
    ).toThrow("no");
    expect(hold.release).toHaveBeenCalledTimes(1);
    expect(names.take(URL, vi.fn())).toBe(false);
  });

  it("lets go once for a forgotten request, however often it is forgotten", () => {
    const hold = fakeHold();
    const names = new PendingNames(hold);
    const request = { url: URL, title: "One" };
    names.expect(request);

    names.forget(request);
    names.forget(request);

    expect(hold.release).toHaveBeenCalledTimes(1);
  });

  it("never lets go of what it was not holding", () => {
    const hold = fakeHold();

    new PendingNames(hold).take(URL, vi.fn());

    expect(hold.release).not.toHaveBeenCalled();
  });
});
