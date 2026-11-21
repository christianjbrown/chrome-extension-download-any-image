// What naming the extension's own downloads is made of.

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

// Keeps a listener registered for as long as anything is holding it.
export interface ListenerHold {
  hold(): void;
  release(): void;
}
