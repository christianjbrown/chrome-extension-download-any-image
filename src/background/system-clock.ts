import type { Clock } from "./filename-ports";

// The time now, read with whatever Date constructor the entry point hands in.
export class SystemClock implements Clock {
  constructor(private readonly dates: new () => Date) {}

  now(): Date {
    return new this.dates();
  }
}
