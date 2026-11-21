import { errorMessage } from "../shared/error-message";
import type { ErrorExplainer } from "./picking";
import type { ChromeRefusal } from "./refusal-ports";

// Says what Chrome's terser refusals mean for the person who clicked. A new
// refusal is a new one of those it is given, not a change here.
export class ChromeErrorExplainer implements ErrorExplainer {
  constructor(private readonly refusals: readonly ChromeRefusal[]) {}

  explain(error: unknown): string {
    const message = errorMessage(error);
    const refusal = this.refusals.find((known) => known.matches(message));
    return refusal === undefined ? message : refusal.explanation;
  }
}
