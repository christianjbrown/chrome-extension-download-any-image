// The service worker: builds the object graph and connects it to Chrome's events.
import { CommandRouter } from "../shared/command-router";
import { backgroundGuards } from "../shared/message-guards";
import type { BackgroundMessage } from "../shared/messages";
import { ChromeErrorExplainer } from "./chrome-errors";
import { CrosshairCursor } from "./cursor-style";
import { DownloadWatcher } from "./download-completion";
import { MimeExtensions } from "./file-extensions";
import { ImageFilenameChooser } from "./filename-chooser";
import { FilenameSuggester } from "./filename-suggester";
import { ImageSaver } from "./image-saver";
import { NavigationReset } from "./navigation-reset";
import { UrlOriginalNames } from "./original-name";
import { PageScript } from "./page-script";
import { PendingNames } from "./pending-names";
import { PickReports } from "./pick-reports";
import { senderTab } from "./sender-tab";
import { SystemClock } from "./system-clock";
import { TabPicker } from "./tab-picker";
import { TimestampedName } from "./timestamped-name";
import { ToggleController } from "./toggle-controller";
import { ToolbarIndicator } from "./toolbar-indicator";

const indicator = new ToolbarIndicator(chrome.action);
const errors = new ChromeErrorExplainer();
const picker = new TabPicker(
  new PageScript(chrome.scripting, chrome.tabs, "page.js"),
  new CrosshairCursor(chrome.scripting),
);
const names = new PendingNames();
const toggle = new ToggleController(picker, indicator, errors);
const reports = new PickReports(
  picker,
  new ImageSaver(
    chrome.downloads,
    names,
    new DownloadWatcher(chrome.downloads),
  ),
  indicator,
  errors,
);
const suggester = new FilenameSuggester(
  chrome.runtime.id,
  names,
  new ImageFilenameChooser(
    new UrlOriginalNames(),
    new TimestampedName(new SystemClock()),
    new MimeExtensions(),
  ),
);
const router = new CommandRouter<BackgroundMessage>(
  "background",
  {
    save: (message, sender) =>
      reports.picked(senderTab(sender), message.url, message.title),
    disarmed: (_message, sender) => reports.disarmed(senderTab(sender)),
    failed: (message, sender) =>
      reports.failed(senderTab(sender), message.error),
  },
  backgroundGuards,
  chrome.runtime.id,
);
const navigation = new NavigationReset(indicator);

chrome.action.onClicked.addListener((tab) => {
  void toggle.toggle(tab);
});
chrome.runtime.onMessage.addListener((message, sender, reply) =>
  router.route(message, sender, reply),
);
chrome.tabs.onUpdated.addListener((tabId, change) => {
  void navigation.changed(tabId, change);
});
// Answers on the spot, so Chrome never waits on this for another download.
chrome.downloads.onDeterminingFilename.addListener((item, suggest) => {
  suggester.suggest(item, suggest);
});
