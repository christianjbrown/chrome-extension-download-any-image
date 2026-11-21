// The script injected into every frame of the tab: builds the object graph and
// waits for the click. A disarm takes all of it away again, the message
// listener included, so a disarmed frame is no longer there to answer.
import { CommandRouter } from "../shared/command-router";
import { TrustedMessages } from "../shared/trusted-messages";
import { DisarmGuard } from "../shared/message-guards";
import { DISARM, PAGE, type PageMessage, type Reply } from "../shared/messages";
import type { CommandSet, GuardSet } from "../shared/routing";
import { BackgroundClient } from "./background-client";
import {
  AFTER,
  BEFORE,
  CssImageFinder,
  OwnStyle,
  PseudoStyle,
} from "./css-finder";
import type { ElementStyle } from "./css-reading";
import {
  IMAGE_SET,
  ImageSetFunction,
  UrlFunction,
  WEBKIT_IMAGE_SET,
} from "./css-image-functions";
import { CssImageUrls } from "./css-image-urls";
import { DpcmUnit, DpiUnit, DppxUnit, XUnit } from "./css-resolutions";
import { instanceOf } from "./checks";
import {
  DocumentBackdrop,
  DocumentOverlay,
  ElementCheck,
  ElementStyles,
  XmlSvgSerializer,
} from "./document-adapters";
import type { Listenable, StyleLook } from "./dom";
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
import { CANVAS_SOURCE, SVG_SOURCE, URL_SOURCE } from "./image-source";
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
import { PageBlobs } from "./page-blobs";
import { DisarmCommand, FrameSlot } from "./page-commands";
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

// Where a frame keeps its armed session, so a second injection can find it.
const KEY = "__downloadAnyImage";
const slot = new FrameSlot(globalThis, KEY);
slot.clear();

// Browser functions are wrapped so they are never called with the wrong `this`.
const elements = new ElementCheck(instanceOf(Element));
const styles = new ElementStyles(elements, (element, pseudo) =>
  getComputedStyle(element, pseudo),
);
const look: StyleLook = (element, pseudo) => styles.look(element, pseudo);
// The units an image-set() option's density can be written in.
const units = [new XUnit(), new DppxUnit(), new DpiUnit(), new DpcmUnit()];
const images = new CssImageUrls([
  new UrlFunction(),
  new ImageSetFunction(IMAGE_SET, units),
  new ImageSetFunction(WEBKIT_IMAGE_SET, units),
]);
const ownStyle = new OwnStyle(look);
const afterStyle = new PseudoStyle(look, AFTER);
const beforeStyle = new PseudoStyle(look, BEFORE);
const css = (property: string, styles: ElementStyle): ImageFinder =>
  new CssImageFinder(styles, images, property);
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
const imgFinder = new ImgFinder();
const inputImageFinder = new InputImageFinder();
const inlineSvgFinder = new InlineSvgFinder();
const canvasFinder = new CanvasFinder();
const videoPosterFinder = new VideoPosterFinder();
// The finders whose elements can also be found by where they sit.
const placedKinds = [
  imgFinder,
  inputImageFinder,
  inlineSvgFinder,
  canvasFinder,
  videoPosterFinder,
];
const finders: ImageFinder[] = [
  imgFinder,
  inputImageFinder,
  new SvgImageFinder(() => document.baseURI),
  inlineSvgFinder,
  canvasFinder,
  videoPosterFinder,
  ...IMAGE_PROPERTIES.map((property) => css(property, afterStyle)),
  ...IMAGE_PROPERTIES.map((property) => css(property, beforeStyle)),
  ...IMAGE_PROPERTIES.map((property) => css(property, ownStyle)),
  css(LIST_MARKER_PROPERTY, ownStyle),
];
const locator = new ImageLocator(
  new PointHits([
    new StackHits(document, new DocumentBackdrop(document)),
    new MediaHits(document, placedKinds),
  ]),
  finders,
);
const bindings = new EventBindings();
const pageWindow: Listenable = window;
const hover = new HoverOutline(
  locator,
  new OutlineBox(new DocumentOverlay<HTMLDivElement>(document)),
  (callback) => requestAnimationFrame(callback),
);
const session = new PickSession(
  [
    new PressShield(bindings, pageWindow, PICK_GESTURES),
    new ClickPick(bindings, pageWindow),
    new PointerOutline(bindings, pageWindow, hover),
    new CancelOnKey(bindings, pageWindow, PICK_GESTURES),
    new StopOnPageHide(bindings, pageWindow),
    new StopOnNavigate(bindings, window.navigation),
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
            () => new FileReader(),
          ),
        ),
      ]),
      [CANVAS_SOURCE]: new CanvasReader(),
      [SVG_SOURCE]: new SvgReader(
        new XmlSvgSerializer(() => new XMLSerializer(), elements),
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
const listener = (
  message: unknown,
  sender: chrome.runtime.MessageSender,
  reply: (reply: Reply<unknown>) => void,
): boolean => router.route(message, sender, reply);

chrome.runtime.onMessage.addListener(listener);
bindings.track(() => {
  chrome.runtime.onMessage.removeListener(listener);
});
session.arm();
slot.keep(session);
