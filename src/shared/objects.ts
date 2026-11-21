// Whether a value from somewhere else is an object whose fields can be read.
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
