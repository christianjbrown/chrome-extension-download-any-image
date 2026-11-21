import { firstDefined, isDefined } from "../../src/shared/defined";

describe("isDefined", () => {
  it.each([
    [0, true],
    ["", true],
    [null, true],
    [undefined, false],
  ])("says whether %s is there", (value, expected) => {
    expect(isDefined(value)).toBe(expected);
  });
});

describe("firstDefined", () => {
  it("stops at the first thing that is made", () => {
    const make = vi.fn((item: number) => (item > 1 ? item * 10 : undefined));

    expect(firstDefined([1, 2, 3], make)).toBe(20);
    expect(make).toHaveBeenCalledTimes(2);
  });

  it("has nothing when nothing is made", () => {
    expect(
      firstDefined([1, 2], (): number | undefined => undefined),
    ).toBeUndefined();
  });
});
