import type { Clock, FallbackNames } from "./filename-ports";
import type { TextCleaner } from "./text-cleaner";

// What a page with no usable title is called instead.
const UNTITLED = "image";

// Every part of the stamp is two digits, so names sort as dates do.
const DIGITS = 2;
const ZERO = "0";

// Date counts months from zero, people from one.
const FIRST_MONTH = 1;

function pad(number: number): string {
  return String(number).padStart(DIGITS, ZERO);
}

function stamp(date: Date): string {
  const day = `${String(date.getFullYear())}-${pad(date.getMonth() + FIRST_MONTH)}-${pad(date.getDate())}`;
  return `${day}-${pad(date.getHours())}-${pad(date.getMinutes())}`;
}

// "2026-10-30-14-05-my-cool-page", in the laptop's own time zone, so
// downloads sort by when they were taken.
export class TimestampedName implements FallbackNames {
  constructor(
    private readonly clock: Clock,
    // Makes the page's title into the name's last part.
    private readonly titles: TextCleaner,
  ) {}

  name(title: string): string {
    return `${stamp(this.clock.now())}-${this.titles.clean(title) || UNTITLED}`;
  }
}
