// Chrome's names for why the document is open and what kind of context it is.
const MATCH_MEDIA = "MATCH_MEDIA";
const OFFSCREEN_DOCUMENT = "OFFSCREEN_DOCUMENT";

// What Chrome is told the document is for.
const JUSTIFICATION = "Reads the colour scheme so the toolbar icon matches it";

export interface OffscreenDocuments {
  createDocument(parameters: {
    url: string;
    reasons: [typeof MATCH_MEDIA];
    justification: string;
  }): Promise<void>;
}

export interface ContextLookup {
  getContexts(filter: {
    contextTypes: [typeof OFFSCREEN_DOCUMENT];
  }): Promise<unknown[]>;
}

// The offscreen document that reports the colour scheme. It stays open for as
// long as Chrome runs, so a change of scheme reaches a sleeping service worker.
export class SchemeDocument {
  private opening: Promise<void> | undefined;

  constructor(
    private readonly documents: OffscreenDocuments,
    private readonly contexts: ContextLookup,
    private readonly path: string,
  ) {}

  // Several events can wake the service worker at once, and Chrome allows only
  // one offscreen document, so they all share one attempt.
  open(): Promise<void> {
    this.opening ??= this.create();
    return this.opening;
  }

  private async create(): Promise<void> {
    const open = await this.contexts.getContexts({
      contextTypes: [OFFSCREEN_DOCUMENT],
    });
    if (open.length > 0) {
      return;
    }
    await this.documents.createDocument({
      url: this.path,
      reasons: [MATCH_MEDIA],
      justification: JUSTIFICATION,
    });
  }
}
