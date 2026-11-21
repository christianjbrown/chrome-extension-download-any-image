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
  // The oldest request for this address, which is then no longer waiting.
  take(url: string): NameRequest | undefined;
}

export class PendingNames implements NameExpectations, NameLookup {
  private readonly waiting: NameRequest[] = [];

  expect(request: NameRequest): void {
    this.waiting.push(request);
  }

  take(url: string): NameRequest | undefined {
    const request = this.waiting.find((waiting) => waiting.url === url);
    if (request !== undefined) {
      this.forget(request);
    }
    return request;
  }

  forget(request: NameRequest): void {
    const index = this.waiting.indexOf(request);
    if (index !== -1) {
      this.waiting.splice(index, 1);
    }
  }
}
