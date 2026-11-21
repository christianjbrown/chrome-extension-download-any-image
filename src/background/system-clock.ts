import type { Clock } from "./filename-ports";

export class SystemClock implements Clock {
  now(): Date {
    return new Date();
  }
}
