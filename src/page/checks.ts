// The page script's checks on what the page and the browser hand it, so
// nothing is read as a type it has not been seen to be.
import { isObject } from "../shared/objects";

// What a field that is not text reads as: no text at all.
const NO_TEXT = "";

// The fields a pointer event carries beyond any event's, all numbers.
const POINTER_FIELDS = ["clientX", "clientY", "button"] as const;
const KEY_FIELD = "key";

// A browser type, such as Element, that a value can be an instance of.
type BrowserType<T> = abstract new (...args: never[]) => T;

export interface PointerFields {
  clientX: number;
  clientY: number;
  button: number;
}

export interface KeyFields {
  key: string;
}

function fieldOf(value: unknown, name: string): unknown {
  return isObject(value) ? value[name] : undefined;
}

// The field at the end of a path of field names, or undefined where the path
// runs out.
export function fieldAt(value: unknown, ...path: string[]): unknown {
  return path.reduce<unknown>((held, name) => fieldOf(held, name), value);
}

// The text at the end of a path of field names, or no text when it is not.
export function textAt(value: unknown, ...path: string[]): string {
  const field = fieldAt(value, ...path);
  return typeof field === "string" ? field : NO_TEXT;
}

// Whether each of the named fields is a function the value can be called with.
export function hasMethods(value: unknown, names: readonly string[]): boolean {
  return names.every((name) => typeof fieldOf(value, name) === "function");
}

function isNumberField(value: unknown, name: string): boolean {
  return typeof fieldOf(value, name) === "number";
}

export function isPointerEvent(event: Event): event is Event & PointerFields {
  return POINTER_FIELDS.every((name) => isNumberField(event, name));
}

export function isKeyEvent(event: Event): event is Event & KeyFields {
  return typeof fieldOf(event, KEY_FIELD) === "string";
}

// A listener for events of one shape, which passes over any other.
export function onlyWhen<E extends Event>(
  admits: (event: Event) => event is E,
  listener: (event: E) => void,
): (event: Event) => void {
  return (event) => {
    if (admits(event)) {
      listener(event);
    }
  };
}

// Whether a value is an instance of the browser type.
export function instanceOf<T>(
  type: BrowserType<T>,
): (value: unknown) => value is T {
  return (value): value is T => value instanceof type;
}
