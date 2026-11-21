// The script injected into every frame of the tab: builds the object graph and
// waits for the click. A disarm takes all of it away again, the message
// listener included, so a disarmed frame is no longer there to answer.
import { CommandRouter } from "../shared/command-router";
import { TrustedMessages } from "../shared/trusted-messages";
import { DisarmGuard } from "../shared/message-guards";
import { DISARM, PAGE, type PageMessage, type Reply } from "../shared/messages";
import type { CommandSet, GuardSet } from "../shared/routing";
import { BackgroundClient } from "./background-client";
import { AFTER, BEFORE, CssImageFinder, type Pseudo } from "./css-finder";
import {
  IMAGE_SET,
  ImageSetFunction,
  UrlFunction,
  WEBKIT_IMAGE_SET,
} from "./css-image-functions";
import { CssImageUrls } from "./css-image-urls";
import { DpcmUnit, DpiUnit, DppxUnit, XUnit } from "./css-resolutions";
import {
  DocumentBackdrop,
  DocumentOverlay,
  XmlSvgSerializer,
  type MarkupWriter,
  type OverlayDocument,
} from "./document-adapters";
import {
  CANVAS_SOURCE,
  SVG_SOURCE,
  URL_SOURCE,
  type Listenable,
  type StyleLook,
} from "./dom";
import {
  CanvasFinder,
  ImgFinder,
  InlineSvgFinder,
  InputImageFinder,
  SvgImageFinder,
  VideoPosterFinder,
} from "./element-finders";
import { EventBindings } from "./event-bindings";
import { HoverOutline } from "./hover-outline";
import { ImageLocator } from "./image-locator";
import { ImagePick } from "./image-pick";
import {
  BlobUrlReader,
  CanvasReader,
  ImageReaders,
  PassThroughReader,
  SvgReader,
  UrlReaders,
} from "./image-readers";
import type { ImageFinder } from "./locating";
import { OutlineBox } from "./outline-box";
import { PageBlobs, type DataUrlReader } from "./page-blobs";
import { DisarmCommand, FrameSlot } from "./page-commands";
import type { Disarmable } from "./pick-control";
import { PICK_GESTURES } from "./pick-gestures";
import { PickSession } from "./pick-session";
import { MediaHits, PointHits, StackHits } from "./point-hits";
import {
  CancelOnKey,
  ClickPick,
  PointerOutline,
  PressShield,
  StopOnNavigate,
  StopOnPageHide,
} from "./session-parts";

type Listener = (
  message: unknown,
  sender: unknown,
  reply: (reply: Reply<unknown>) => void,
) => boolean;

// Where a frame keeps its armed session, so a second injection can find it.
const KEY = "__downloadAnyImage";
const slot = new FrameSlot(
  globalThis as unknown as Record<string, Disarmable | undefined>,
  KEY,
);
slot.clear();

// Browser functions are wrapped so they are never called with the wrong `this`.
const look: StyleLook = (element, pseudo) =>
  getComputedStyle(element as unknown as Element, pseudo);
// The units an image-set() option's density can be written in.
const units = [new XUnit(), new DppxUnit(), new DpiUnit(), new DpcmUnit()];
const images = new CssImageUrls([
  new UrlFunction(),
  new ImageSetFunction(IMAGE_SET, units),
  new ImageSetFunction(WEBKIT_IMAGE_SET, units),
]);
const css = (property: string, pseudo?: Pseudo): ImageFinder =>
  new CssImageFinder(look, images, property, pseudo);
const IMAGE_PROPERTIES = [
  "content",
  "background-image",
  "mask-image",
  "-webkit-mask-image",
];
// A list item's marker, which has no pseudo-element of its own to look at.
const LIST_MARKER_PROPERTY = "list-style-image";
// Top down: the element's own picture, then what its ::after and ::before
// paint over its background, then the background and the rest.
const finders: ImageFinder[] = [
  new ImgFinder(),
  new InputImageFinder(),
  new SvgImageFinder(() => document.baseURI),
  new InlineSvgFinder(),
  new CanvasFinder(),
  new VideoPosterFinder(),
  ...IMAGE_PROPERTIES.map((property) => css(property, AFTER)),
  ...IMAGE_PROPERTIES.map((property) => css(property, BEFORE)),
  ...IMAGE_PROPERTIES.map((property) => css(property)),
  css(LIST_MARKER_PROPERTY),
];
const locator = new ImageLocator(
  new PointHits([
    new StackHits(document, new DocumentBackdrop(document)),
    new MediaHits(document),
  ]),
  finders,
);
const bindings = new EventBindings();
const pageWindow = window as unknown as Listenable;
const hover = new HoverOutline(
  locator,
  new OutlineBox(new DocumentOverlay(document as unknown as OverlayDocument)),
  (callback) => requestAnimationFrame(callback),
);
const session = new PickSession(
  [
    new PressShield(bindings, pageWindow, PICK_GESTURES),
    new ClickPick(bindings, pageWindow),
    new PointerOutline(bindings, pageWindow, hover),
    new CancelOnKey(bindings, pageWindow, PICK_GESTURES),
    new StopOnPageHide(bindings, pageWindow),
    new StopOnNavigate(
      bindings,
      (window as { navigation?: Listenable }).navigation,
    ),
  ],
  bindings,
  hover,
  new ImagePick(
    locator,
    new ImageReaders({
      [URL_SOURCE]: new UrlReaders([
        new PassThroughReader(),
        new BlobUrlReader(
          new PageBlobs(
            (url) => fetch(url),
            () => new FileReader() as unknown as DataUrlReader,
          ),
        ),
      ]),
      [CANVAS_SOURCE]: new CanvasReader(),
      [SVG_SOURCE]: new SvgReader(
        new XmlSvgSerializer(
          () => new XMLSerializer() as unknown as MarkupWriter,
        ),
        look,
      ),
    }),
    new BackgroundClient(chrome.runtime),
    () => document.title,
  ),
);
const router = new CommandRouter<PageMessage>(
  new TrustedMessages<PageMessage>(
    PAGE,
    Object.values({
      [DISARM]: new DisarmGuard(),
    } satisfies GuardSet<PageMessage>),
    chrome.runtime.id,
  ),
  Object.values({
    [DISARM]: new DisarmCommand(session),
  } satisfies CommandSet<PageMessage>),
);
const listener: Listener = (message, sender, reply) =>
  router.route(message, sender as { id?: string }, reply);

chrome.runtime.onMessage.addListener(listener);
bindings.track(() => {
  chrome.runtime.onMessage.removeListener(listener);
});
session.arm();
slot.keep(session);
