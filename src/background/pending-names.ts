// A download the extension started, waiting for Chrome to ask what to call it.
export interface NameRequest {
  url: string;
  title: string;
}

export interface NameRequests {
  expect(request: NameRequest): void;
  // The oldest request for this address, which is then no longer waiting.
  take(url: string): NameRequest | undefined;
  forget(request: NameRequest): void;
}

export class PendingNames implements NameRequests {
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
