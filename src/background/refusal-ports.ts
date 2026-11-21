// One of Chrome's refusals, and what to tell the person instead.
export interface ChromeRefusal {
  matches(message: string): boolean;
  readonly explanation: string;
}
