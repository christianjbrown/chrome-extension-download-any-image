import type { DownloadCompletion } from "./download-completion";
import { UNIQUIFY } from "./download-terms";
import type { NameExpectations } from "./pending-names";

export interface DownloadStarter {
  download(options: {
    url: string;
    saveAs: false;
    conflictAction: typeof UNIQUIFY;
  }): Promise<number>;
}

export interface ImageDownloader {
  save(url: string, title: string): Promise<void>;
}

// Chrome fetches the image itself, with the browser's own cookies and no CORS,
// so whatever the page could show can be saved. The name is settled later, once
// Chrome knows the file's type: see FilenameSuggester.
export class ImageSaver implements ImageDownloader {
  constructor(
    private readonly downloads: DownloadStarter,
    private readonly names: NameExpectations,
    private readonly completion: DownloadCompletion,
  ) {}

  async save(url: string, title: string): Promise<void> {
    const request = { url, title };
    this.names.expect(request);
    try {
      const id = await this.downloads.download({
        url,
        saveAs: false,
        conflictAction: UNIQUIFY,
      });
      await this.completion.finished(id);
    } finally {
      this.names.forget(request);
    }
  }
}
