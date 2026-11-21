import type { ListenerHold } from "./filename-listening";

// A download the extension started, waiting for Chrome to ask what to call it.
export interface NameRequest {
  url: string;
  title: string;
}

// The side that starts a download: it says a request is coming, and forgets
// it once the download is over.
export interface NameExpectations {
  expect(request: NameRequest): void;
  forget(request: NameRequest): void;
}

// The side that names a download when Chrome asks.
export interface NameLookup {
  // Hands the oldest request for this address to answer, after which it is
  // no longer waiting. Says whether there was one.
  take(url: string, answer: (request: NameRequest) => void): boolean;
}

// Every waiting request holds Chrome's filename listener, and lets go of it
// the moment the request stops waiting, so the two cannot drift apart. A
// taken request is answered before it lets go, so Chrome hears the name
// before the listener comes off.
export class PendingNames implements NameExpectations, NameLookup {
  private readonly waiting: NameRequest[] = [];

  constructor(private readonly listening: ListenerHold) {}

  expect(request: NameRequest): void {
    this.listening.hold();
    this.waiting.push(request);
  }

  take(url: string, answer: (request: NameRequest) => void): boolean {
    const request = this.waiting.find((waiting) => waiting.url === url);
    if (request === undefined) {
      return false;
    }
    try {
      answer(request);
    } finally {
      this.forget(request);
    }
    return true;
  }

  forget(request: NameRequest): void {
    const index = this.waiting.indexOf(request);
    if (index !== -1) {
      this.waiting.splice(index, 1);
      this.listening.release();
    }
  }
}
