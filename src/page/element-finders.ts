import {
  IMAGE_INPUT_TYPE,
  SVG_NAMESPACE,
  TAG,
  type CanvasLike,
  type PageElement,
  type SvgLike,
} from "./dom";
import {
  CANVAS_SOURCE,
  SVG_SOURCE,
  URL_SOURCE,
  type ImageSource,
} from "./image-source";
import type { ImageFinder, PlacedKind } from "./locating";

function urlSource(url: string): ImageSource | undefined {
  return url === "" ? undefined : { kind: URL_SOURCE, url };
}

function isHtml(element: PageElement, name: string): boolean {
  return element.localName === name && element.namespaceURI !== SVG_NAMESPACE;
}

function isSvg(element: PageElement, name: string): boolean {
  return element.localName === name && element.namespaceURI === SVG_NAMESPACE;
}

type ImgLike = PageElement & { currentSrc: string; src: string };
type InputLike = PageElement & { type?: string; src?: string };
type SvgImageLike = PageElement & { href: { baseVal: string } };
type NestableSvg = SvgLike & { ownerSVGElement: unknown };

function isImageButton(element: PageElement): element is InputLike {
  return (
    isHtml(element, TAG.input) &&
    (element as InputLike).type === IMAGE_INPUT_TYPE
  );
}

function isOutermostSvg(element: PageElement): element is NestableSvg {
  return (
    isSvg(element, TAG.svg) && (element as NestableSvg).ownerSVGElement === null
  );
}

// The picture an <img> is showing right now, which for srcset and <picture> is
// the one the browser chose.
export class ImgFinder implements ImageFinder, PlacedKind {
  readonly selector = TAG.img;

  find(element: PageElement): ImageSource | undefined {
    return isHtml(element, TAG.img)
      ? this.shown(element as ImgLike)
      : undefined;
  }

  private shown(img: ImgLike): ImageSource | undefined {
    return urlSource(img.currentSrc || img.src);
  }
}

export class InputImageFinder implements ImageFinder, PlacedKind {
  readonly selector = `${TAG.input}[type=${IMAGE_INPUT_TYPE}]`;

  find(element: PageElement): ImageSource | undefined {
    return isImageButton(element) ? this.shown(element) : undefined;
  }

  private shown(input: InputLike): ImageSource | undefined {
    return urlSource(input.src ?? "");
  }
}

export class VideoPosterFinder implements ImageFinder, PlacedKind {
  readonly selector = TAG.video;

  find(element: PageElement): ImageSource | undefined {
    if (!isHtml(element, TAG.video)) {
      return undefined;
    }
    return urlSource((element as PageElement & { poster: string }).poster);
  }
}

// Whatever a script drew, read out of the canvas itself.
export class CanvasFinder implements ImageFinder, PlacedKind {
  readonly selector = TAG.canvas;

  find(element: PageElement): ImageSource | undefined {
    if (!isHtml(element, TAG.canvas)) {
      return undefined;
    }
    return {
      kind: CANVAS_SOURCE,
      canvas: element as PageElement & CanvasLike,
    };
  }
}

// An <image> inside an SVG, whose href can be relative to the page.
export class SvgImageFinder implements ImageFinder {
  constructor(private readonly baseUrl: () => string) {}

  find(element: PageElement): ImageSource | undefined {
    return isSvg(element, TAG.svgImage)
      ? this.linked((element as SvgImageLike).href.baseVal)
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
