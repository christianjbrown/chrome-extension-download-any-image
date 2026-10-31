import type { FilenameChooser } from "./filename-chooser";
import type { NameRequests } from "./pending-names";

export interface DownloadItem {
  byExtensionId?: string | undefined;
  url: string;
  finalUrl?: string | undefined;
  mime?: string | undefined;
}

export type Suggest = (suggestion: {
  filename: string;
  conflictAction: "uniquify";
}) => void;

// Chrome asks every listener to name every download. Only the ones this
// extension started get an answer; for the rest, saying nothing leaves Chrome's
// own choice alone.
export class FilenameSuggester {
  constructor(
    private readonly extensionId: string,
    private readonly names: NameRequests,
    private readonly chooser: FilenameChooser,
  ) {}

  suggest(item: DownloadItem, suggest: Suggest): void {
    if (item.byExtensionId !== this.extensionId) {
      return;
    }
    const request =
      this.names.take(item.url) ??
      (item.finalUrl === undefined
        ? undefined
        : this.names.take(item.finalUrl));
    if (request === undefined) {
      return;
    }
    suggest({
      filename: this.chooser.choose(request.url, request.title, item.mime),
      conflictAction: "uniquify",
    });
  }
}
