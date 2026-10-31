import type { Clock } from "./timestamped-name";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
