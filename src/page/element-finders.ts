import { fieldAt, hasMethods, textAt } from "./checks";
import {
  IMAGE_INPUT_TYPE,
  SVG_NAMESPACE,
  TAG,
  type CanvasLike,
  type PageElement,
  type SvgLike,
} from "./dom";
import { CANVAS_SOURCE } from "./canvas-source";
import type { ImageSource } from "./image-source";
import { SVG_SOURCE } from "./svg-source";
import { URL_SOURCE } from "./url-source";
import type { ImageFinder, PlacedKind } from "./locating";

// The fields read off each kind of element, by the names the browser gives
// them.
const TYPE = "type";
const SRC = "src";
const CURRENT_SRC = "currentSrc";
const POSTER = "poster";
const HREF = "href";
const BASE_VAL = "baseVal";
const OWNER_SVG = "ownerSVGElement";
const STYLE = "style";

// The methods a canvas and an inline SVG are read and copied through.
const CANVAS_METHODS = ["toDataURL"];
const SVG_METHODS = ["cloneNode", "hasAttribute", "setAttribute"];
const STYLE_METHODS = ["setProperty"];

function urlSource(url: string): ImageSource | undefined {
  return url === "" ? undefined : { kind: URL_SOURCE, url };
}

function isHtml(element: PageElement, name: string): boolean {
  return element.localName === name && element.namespaceURI !== SVG_NAMESPACE;
}

function isSvg(element: PageElement, name: string): boolean {
  return element.localName === name && element.namespaceURI === SVG_NAMESPACE;
}

function isImageButton(element: PageElement): boolean {
  return (
    isHtml(element, TAG.input) && textAt(element, TYPE) === IMAGE_INPUT_TYPE
  );
}

function isCanvas(element: PageElement): element is PageElement & CanvasLike {
  return isHtml(element, TAG.canvas) && hasMethods(element, CANVAS_METHODS);
}

// An element with everything an SVG is copied and restyled through.
function isCopyableSvg(element: PageElement): element is SvgLike {
  return (
    hasMethods(element, SVG_METHODS) &&
    hasMethods(fieldAt(element, STYLE), STYLE_METHODS)
  );
}

function isTopmost(element: PageElement): boolean {
  return fieldAt(element, OWNER_SVG) === null;
}

function isOutermostSvg(element: PageElement): element is SvgLike {
  return isSvg(element, TAG.svg) && isTopmostCopyable(element);
}

function isTopmostCopyable(element: PageElement): element is SvgLike {
  return isTopmost(element) && isCopyableSvg(element);
}

// The picture an <img> is showing right now, which for srcset and <picture> is
// the one the browser chose.
export class ImgFinder implements ImageFinder, PlacedKind {
  readonly selector = TAG.img;

  find(element: PageElement): ImageSource | undefined {
    return isHtml(element, TAG.img) ? this.shown(element) : undefined;
  }

  private shown(img: PageElement): ImageSource | undefined {
    return urlSource(textAt(img, CURRENT_SRC) || textAt(img, SRC));
  }
}

export class InputImageFinder implements ImageFinder, PlacedKind {
  readonly selector = `${TAG.input}[type=${IMAGE_INPUT_TYPE}]`;

  find(element: PageElement): ImageSource | undefined {
    return isImageButton(element) ? this.shown(element) : undefined;
  }

  private shown(input: PageElement): ImageSource | undefined {
    return urlSource(textAt(input, SRC));
  }
}

export class VideoPosterFinder implements ImageFinder, PlacedKind {
  readonly selector = TAG.video;

  find(element: PageElement): ImageSource | undefined {
    if (!isHtml(element, TAG.video)) {
      return undefined;
    }
    return urlSource(textAt(element, POSTER));
  }
}

// Whatever a script drew, read out of the canvas itself.
export class CanvasFinder implements ImageFinder, PlacedKind {
  readonly selector = TAG.canvas;

  find(element: PageElement): ImageSource | undefined {
    return isCanvas(element)
      ? { kind: CANVAS_SOURCE, canvas: element }
      : undefined;
  }
}

// An <image> inside an SVG, whose href can be relative to the page.
export class SvgImageFinder implements ImageFinder {
  constructor(private readonly baseUrl: () => string) {}

  find(element: PageElement): ImageSource | undefined {
    return isSvg(element, TAG.svgImage)
      ? this.linked(textAt(element, HREF, BASE_VAL))
      : undefined;
  }

  private linked(href: string): ImageSource | undefined {
    return href === ""
      ? undefined
      : { kind: URL_SOURCE, url: new URL(href, this.baseUrl()).href };
  }
}

// An SVG drawn in the page, saved whole. The outermost one, since an <svg> can
// nest inside another.
export class InlineSvgFinder implements ImageFinder, PlacedKind {
  readonly selector = TAG.svg;

  find(element: PageElement): ImageSource | undefined {
    return isOutermostSvg(element)
      ? { kind: SVG_SOURCE, svg: element }
      : undefined;
  }
}
