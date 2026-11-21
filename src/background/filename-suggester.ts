import { NO_OPINION, UNIQUIFY } from "./download-terms";
import type { FilenameChooser } from "./filename-ports";
import type { NameLookup, NameRequest } from "./name-requests";

export interface DownloadItem {
  byExtensionId?: string | undefined;
  url: string;
  finalUrl?: string | undefined;
  mime?: string | undefined;
}

export type Suggest = (suggestion: {
  filename: string;
  conflictAction: typeof UNIQUIFY;
}) => void;

// Chrome only asks while one of this extension's downloads is waiting for a
// name (see FilenameListening), but any other download that starts meanwhile
// is asked about too. Those get an explicit no opinion, which Chrome skips,
// rather than silence, which Chrome reads as a suggestion of no name at all.
export class FilenameSuggester {
  constructor(
    private readonly extensionId: string,
    private readonly names: NameLookup,
    private readonly chooser: FilenameChooser,
  ) {}

  suggest(item: DownloadItem, suggest: Suggest): void {
    const named =
      item.byExtensionId === this.extensionId && this.nameOwn(item, suggest);
    if (!named) {
      suggest(NO_OPINION);
    }
  }

  private nameOwn(item: DownloadItem, suggest: Suggest): boolean {
    const answer = (request: NameRequest) => {
      suggest({
        filename: this.chooser.choose(request.url, request.title, item.mime),
        conflictAction: UNIQUIFY,
      });
    };
    return (
      this.names.take(item.url, answer) ||
      (item.finalUrl !== undefined && this.names.take(item.finalUrl, answer))
    );
  }
}
