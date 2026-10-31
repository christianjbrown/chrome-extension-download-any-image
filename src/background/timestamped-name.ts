import { kebab } from "./filename-text";

export interface Clock {
  now(): Date;
}

export interface FallbackNames {
  name(title: string): string;
}

function pad(number: number): string {
  return String(number).padStart(2, "0");
}

function stamp(date: Date): string {
  const day = `${String(date.getFullYear())}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  return `${day}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

// "2026-10-30-14-05-my-cool-page", in the laptop's own time zone, so
// downloads sort by when they were taken.
export class TimestampedName implements FallbackNames {
  constructor(private readonly clock: Clock) {}

  name(title: string): string {
    return `${stamp(this.clock.now())}-${kebab(title) || "image"}`;
  }
}
