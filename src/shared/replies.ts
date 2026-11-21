import { errorMessage } from "./error-message";
import { isObject } from "./objects";

// What a context answers a message with: the value its work came to, or why
// it failed.
export type Reply<T> = { ok: true; value: T } | { ok: false; error: string };

// Whether an answer from another context is a reply saying its work went
// through. Anything else, a failure or no answer at all, is not.
export function isOkReply(reply: unknown): boolean {
  return isObject(reply) && reply.ok === true;
}

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
