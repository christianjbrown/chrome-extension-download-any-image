import { errorMessage } from "../shared/error-message";
import type { ErrorExplainer } from "./picking";
import type { ChromeRefusal } from "./refusal-ports";

// Says what Chrome's terser refusals mean for the person who clicked. A new
// refusal is a new one of those it is given, not a change here.
export class ChromeErrorExplainer implements ErrorExplainer {
  constructor(private readonly refusals: readonly ChromeRefusal[]) {}

  explain(error: unknown): string {
    const message = errorMessage(error);
    return (
      this.refusals.find((refusal) => refusal.matches(message))?.explanation ??
      message
    );
  }
}
