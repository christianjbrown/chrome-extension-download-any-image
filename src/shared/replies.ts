import { errorMessage } from "./error-message";
import type { Reply } from "./messages";

// Answers a message once its work settles, with the value or the reason it failed.
export function replyWhenDone<T>(
  work: Promise<T>,
  reply: (reply: Reply<T>) => void,
): void {
  work.then(
    (value) => {
      reply({ ok: true, value });
    },
    (error: unknown) => {
      reply({ ok: false, error: errorMessage(error) });
    },
  );
}
