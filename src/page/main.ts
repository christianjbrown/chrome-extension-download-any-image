// The script injected into every frame of the tab: builds the object graph and
// waits for the click. A disarm takes all of it away again, the message
// listener included, so a disarmed frame is no longer there to answer.
import { CommandRouter } from "../shared/command-router";
import { pageGuards } from "../shared/message-guards";
import type { PageMessage, Reply } from "../shared/messages";
import { BackgroundClient } from "./background-client";
import { CssImageFinder } from "./css-finder";
import { CssImageUrls } from "./css-image-urls";
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
import { ImageLocator, type ImageFinder } from "./image-locator";
import {
  BlobUrlReader,
  CanvasReader,
  ImageReaders,
  PassThroughReader,
  SvgReader,
} from "./image-readers";
import { OutlineBox } from "./outline-box";
import { PickSession } from "./pick-session";
import { MediaHits, PointHits, StackHits } from "./point-hits";

type Listener = (
  message: unknown,
  sender: unknown,
  reply: (reply: Reply<unknown>) => void,
) => boolean;

const KEY = "__downloadThatImage";
const globals = globalThis as unknown as Record<
  string,
  PickSession | undefined
>;
// A second injection into a frame that is still armed replaces the first.
globals[KEY]?.disarm();

// Browser functions are wrapped so they are never called with the wrong `this`.
const look: StyleLook = (element, pseudo) =>
  getComputedStyle(element as unknown as Element, pseudo);
const images = new CssImageUrls();
const css = (property: string, pseudo?: "::before" | "::after"): ImageFinder =>
  new CssImageFinder(look, images, property, pseudo);
const IMAGE_PROPERTIES = [
  "content",
  "background-image",
  "mask-image",
  "-webkit-mask-image",
];
// Top down: the element's own picture, then what its ::after and ::before
// paint over its background, then the background and the rest.
const finders: ImageFinder[] = [
  new ImgFinder(),
  new InputImageFinder(),
  new SvgImageFinder(() => document.baseURI),
  new InlineSvgFinder(),
  new CanvasFinder(),
  new VideoPosterFinder(),
  ...IMAGE_PROPERTIES.map((property) => css(property, "::after")),
  ...IMAGE_PROPERTIES.map((property) => css(property, "::before")),
  ...IMAGE_PROPERTIES.map((property) => css(property)),
  css("list-style-image"),
];
const locator = new ImageLocator(
  new PointHits([
    new StackHits(
      document,
      (element) =>
        element === (document.documentElement as unknown) ||
        element === (document.body as unknown),
    ),
    new MediaHits(document),
  ]),
  finders,
);
const bindings = new EventBindings();
const session = new PickSession({
  bindings,
  window: window as unknown as Listenable,
  navigation: (window as { navigation?: Listenable }).navigation,
  hover: new HoverOutline(
    locator,
    new OutlineBox(
      () => document.createElement("div"),
      (element) => {
        document.documentElement.append(element as unknown as Node);
      },
    ),
    (callback) => requestAnimationFrame(callback),
  ),
  locator,
  readers: new ImageReaders([
    new PassThroughReader(),
    new BlobUrlReader({
      fetch: (url) => fetch(url).then((response) => response.blob()),
      toDataUrl: (blob) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => {
            reject(new Error("The image could not be read"));
          };
          reader.readAsDataURL(blob as Blob);
        }),
    }),
    new CanvasReader(),
    new SvgReader(
      (svg) => new XMLSerializer().serializeToString(svg as unknown as Node),
      look,
    ),
  ]),
  reporter: new BackgroundClient(chrome.runtime),
  title: () => document.title,
});
const router = new CommandRouter<PageMessage>(
  "page",
  {
    disarm: () => {
      session.disarm();
      return Promise.resolve(true);
    },
  },
  pageGuards,
  chrome.runtime.id,
);
const listener: Listener = (message, sender, reply) =>
  router.route(message, sender as { id?: string }, reply);

chrome.runtime.onMessage.addListener(listener);
bindings.track(() => {
  chrome.runtime.onMessage.removeListener(listener);
});
session.arm();
globals[KEY] = session;
