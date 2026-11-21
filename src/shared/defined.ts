// Picking things out of a list of maybes.

export function isDefined<T>(value: T | undefined): value is T {
  return value !== undefined;
}

// The first thing made from the items, in order, that is not undefined. Stops
// there, so nothing is made from the items after it.
export function firstDefined<T, R>(
  items: readonly T[],
  make: (item: T) => R | undefined,
): R | undefined {
  return items
    .values()
    .map((item) => make(item))
    .find(isDefined);
}
