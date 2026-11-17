import { SchemeDocument } from "../../src/background/scheme-document";

function fakes(open: unknown[] = []) {
  return {
    documents: { createDocument: vi.fn().mockResolvedValue(undefined) },
    contexts: { getContexts: vi.fn().mockResolvedValue(open) },
  };
}

describe("SchemeDocument", () => {
  it("opens the offscreen document to read the colour scheme", async () => {
    const { documents, contexts } = fakes();

    await new SchemeDocument(documents, contexts, "offscreen.html").open();

    expect(contexts.getContexts).toHaveBeenCalledWith({
      contextTypes: ["OFFSCREEN_DOCUMENT"],
    });
    expect(documents.createDocument).toHaveBeenCalledWith({
      url: "offscreen.html",
      reasons: ["MATCH_MEDIA"],
      justification: "Reads the colour scheme so the toolbar icon matches it",
    });
  });

  it("leaves a document that is already open alone", async () => {
    const { documents, contexts } = fakes([{}]);

    await new SchemeDocument(documents, contexts, "offscreen.html").open();

    expect(documents.createDocument).not.toHaveBeenCalled();
  });

  it("opens only one document however many times it is asked", async () => {
    const { documents, contexts } = fakes();
    const document = new SchemeDocument(documents, contexts, "offscreen.html");

    await Promise.all([document.open(), document.open()]);

    expect(documents.createDocument).toHaveBeenCalledTimes(1);
  });
});
