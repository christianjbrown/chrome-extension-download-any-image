// What arming the picker in a tab, and dealing with the click, is made of.
import type { Sender } from "../shared/routing";

// The tab a page script's message came from, which every report is about.
export interface SenderTabs {
  tabOf(sender: Sender): number;
}

// Stopping the wait for the click in one tab.
export interface PickerStop {
  // Whether it was waiting. Never fails: there is always a way to stop.
  disarm(tabId: number): Promise<boolean>;
}

// Waiting for the click in one tab, and stopping again.
export interface Picker extends PickerStop {
  arm(tabId: number): Promise<void>;
}

// The script that waits in the page for the click.
export interface PickerScript {
  inject(tabId: number): Promise<void>;
  // Whether any frame in the tab was still waiting.
  disarm(tabId: number): Promise<boolean>;
}

// The crosshair the page shows while the picker waits.
export interface Cursor {
  show(tabId: number): Promise<void>;
  hide(tabId: number): Promise<void>;
}

// Saving the picked image to the downloads folder.
export interface ImageDownloader {
  save(url: string, title: string): Promise<void>;
}

// Waiting for a download to finish.
export interface DownloadCompletion {
  // Settles once the file is written, or fails with Chrome's reason.
  finished(id: number): Promise<void>;
}

// What to tell the person about something that went wrong.
export interface ErrorExplainer {
  explain(error: unknown): string;
}

// The page picked an image in a tab.
export interface PickedOutcome {
  picked(tabId: number, url: string, title: string): Promise<void>;
}

// The page in a tab stopped waiting with nothing picked.
export interface DisarmedOutcome {
  disarmed(tabId: number): Promise<void>;
}

// The page in a tab could not read the picture.
export interface FailedOutcome {
  failed(tabId: number, error: string): Promise<void>;
}

// How a click in a tab turned out, as the page reports it.
export interface PickOutcomes
  extends PickedOutcome, DisarmedOutcome, FailedOutcome {}
