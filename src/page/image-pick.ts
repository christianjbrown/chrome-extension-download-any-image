import { errorMessage } from "../shared/error-message";
import type { ImageReading } from "./image-reading";
import type { Locator } from "./locating";
import type { PickFlow, PickReporter } from "./pick-control";

// The page's title, which the fallback filename is made from.
export type PageTitle = () => string;

// An image under the click is read and handed over; anything else simply
// stops the wait.
export class ImagePick implements PickFlow {
  constructor(
    private readonly locator: Locator,
    private readonly readers: ImageReading,
    private readonly reporter: PickReporter,
    private readonly title: PageTitle,
  ) {}

  cancel(): void {
    this.reporter.disarmed();
  }

  async pick(x: number, y: number): Promise<void> {
    const found = this.locator.locate(x, y);
    if (found === undefined) {
      this.reporter.disarmed();
      return;
    }
    try {
      const url = await this.readers.read(found.source);
      this.reporter.picked(url, this.title());
    } catch (error) {
      this.reporter.failed(errorMessage(error));
    }
  }
}
