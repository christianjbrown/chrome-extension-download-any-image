// The service worker: builds the object graph and connects it to Chrome's events.
import { CommandRouter } from "../shared/command-router";
import { TrustedMessages } from "../shared/trusted-messages";
import {
  DisarmedGuard,
  FailedGuard,
  SaveGuard,
  SchemeGuard,
} from "../shared/message-guards";
import {
  BACKGROUND,
  DISARMED,
  FAILED,
  SAVE,
  SCHEME,
  type BackgroundMessage,
} from "../shared/messages";
import type { CommandSet, GuardSet } from "../shared/routing";
import {
  DisarmedCommand,
  FailedCommand,
  SaveCommand,
  SchemeCommand,
} from "./background-commands";
import { ARMED, ERROR, IDLE, type LookSet } from "./button-looks";
import { ChromeErrorExplainer } from "./chrome-errors";
import {
  ActiveTabRefusal,
  FileUrlRefusal,
  OwnPageRefusal,
  WebStoreRefusal,
} from "./chrome-refusals";
import { ClickScheme } from "./click-scheme";
import { ClosedTabAction } from "./closed-tab-action";
import { BACKGROUND_CONFIG } from "./config";
import { CrosshairCursor } from "./cursor-style";
import { DownloadWatcher } from "./download-completion";
import { OFFSCREEN_DOCUMENT_FILE, PAGE_SCRIPT_FILE } from "./entry-files";
import { MimeExtensions } from "./file-extensions";
import { ImageFilenameChooser } from "./filename-chooser";
import { FilenameListening } from "./filename-listening";
import { FilenameSuggester, type Suggest } from "./filename-suggester";
import { KebabText, SafeStemText } from "./filename-text";
import { ImageSaver } from "./image-saver";
import {
  AvifType,
  BmpType,
  GifType,
  HeicType,
  HeifType,
  IconType,
  JpegType,
  JxlType,
  PngType,
  SvgType,
  TiffType,
  WebpType,
} from "./image-types";
import { MeaningfulNames } from "./meaningful-names";
import { NavigationReset } from "./navigation-reset";
import { UrlOriginalNames } from "./original-name";
import { PageScript } from "./page-script";
import { PendingNames } from "./pending-names";
import { PickReports } from "./pick-reports";
import { SchemeDocument } from "./scheme-document";
import { SCHEME_POLICY, UNKNOWN_SCHEME } from "./scheme-state";
import { SchemeStore } from "./scheme-store";
import { SystemClock } from "./system-clock";
import { TabPicker } from "./tab-picker";
import { TabScheme } from "./tab-scheme";
import { TimestampedName } from "./timestamped-name";
import { ToggleController } from "./toggle-controller";
import { ToolbarIcon } from "./toolbar-icon";
import { ToolbarIndicator } from "./toolbar-indicator";
import { ArmedLook, ErrorLook, IdleLook } from "./toolbar-looks";
import { ToolbarScheme } from "./toolbar-scheme";

const indicator = new ToolbarIndicator(new ClosedTabAction(chrome.action), {
  [IDLE]: new IdleLook(),
  [ARMED]: new ArmedLook(),
  [ERROR]: new ErrorLook(),
} satisfies LookSet);
const toolbarScheme = new ToolbarScheme(
  new SchemeStore(chrome.storage.local, UNKNOWN_SCHEME),
  new ToolbarIcon(chrome.action),
  SCHEME_POLICY,
);
const clickScheme = new ClickScheme(
  new TabScheme(chrome.scripting),
  toolbarScheme,
);
const schemeDocument = new SchemeDocument(
  chrome.offscreen,
  chrome.runtime,
  OFFSCREEN_DOCUMENT_FILE,
);
const errors = new ChromeErrorExplainer([
  new OwnPageRefusal(),
  new WebStoreRefusal(),
  new FileUrlRefusal(),
  new ActiveTabRefusal(),
]);
const picker = new TabPicker(
  new PageScript(chrome.scripting, chrome.tabs, PAGE_SCRIPT_FILE),
  new CrosshairCursor(chrome.scripting),
);
// Chrome's filename listener is only registered while one of this
// extension's downloads is waiting for a name. The suggester it calls is built
// below, from the names that hold it.
const names = new PendingNames(
  new FilenameListening(
    chrome.downloads.onDeterminingFilename,
    (item: chrome.downloads.DownloadItem, suggest: Suggest) => {
      suggester.suggest(item, suggest);
    },
  ),
);
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
    new UrlOriginalNames(
      BACKGROUND_CONFIG.maxExtensionLength,
      new SafeStemText(BACKGROUND_CONFIG.maxStemLength),
      new MeaningfulNames(BACKGROUND_CONFIG.originalNames),
    ),
    new TimestampedName(
      new SystemClock(),
      new KebabText(BACKGROUND_CONFIG.maxTitleLength),
    ),
    new MimeExtensions([
      new JpegType(),
      new PngType(),
      new GifType(),
      new WebpType(),
      new AvifType(),
      new SvgType(),
      new BmpType(),
      new IconType(),
      new TiffType(),
      new HeicType(),
      new HeifType(),
      new JxlType(),
    ]),
  ),
);
const router = new CommandRouter<BackgroundMessage>(
  new TrustedMessages<BackgroundMessage>(
    BACKGROUND,
    Object.values({
      [SAVE]: new SaveGuard(BACKGROUND_CONFIG.maxMessageText),
      [DISARMED]: new DisarmedGuard(),
      [FAILED]: new FailedGuard(BACKGROUND_CONFIG.maxMessageText),
      [SCHEME]: new SchemeGuard(),
    } satisfies GuardSet<BackgroundMessage>),
    chrome.runtime.id,
  ),
  Object.values({
    [SAVE]: new SaveCommand(reports),
    [DISARMED]: new DisarmedCommand(reports),
    [FAILED]: new FailedCommand(reports),
    [SCHEME]: new SchemeCommand(toolbarScheme),
  } satisfies CommandSet<BackgroundMessage>),
);
const navigation = new NavigationReset(indicator);

chrome.action.onClicked.addListener((tab) => {
  void toggle.toggle(tab);
});
chrome.action.onClicked.addListener((tab) => {
  void clickScheme.clicked(tab);
});
chrome.runtime.onMessage.addListener((message, sender, reply) =>
  router.route(message, sender, reply),
);
chrome.tabs.onUpdated.addListener((tabId, change) => {
  void navigation.changed(tabId, change);
});
// Chrome starts with no offscreen document, and nothing else wakes the service
// worker then.
chrome.runtime.onStartup.addListener(() => {
  void schemeDocument.open();
});
void schemeDocument.open();
