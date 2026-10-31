import {
  SVG_NAMESPACE,
  type CanvasLike,
  type ImageSource,
  type PageElement,
  type SvgLike,
} from "./dom";
import type { ImageFinder } from "./image-locator";

function urlSource(url: string): ImageSource | undefined {
  return url === "" ? undefined : { kind: "url", url };
}

function isHtml(element: PageElement, name: string): boolean {
  return element.localName === name && element.namespaceURI !== SVG_NAMESPACE;
}

// The picture an <img> is showing right now, which for srcset and <picture> is
// the one the browser chose.
export class ImgFinder implements ImageFinder {
  find(element: PageElement): ImageSource | undefined {
    if (!isHtml(element, "img")) {
      return undefined;
    }
    const img = element as PageElement & { currentSrc: string; src: string };
    return urlSource(img.currentSrc || img.src);
  }
}

export class InputImageFinder implements ImageFinder {
  find(element: PageElement): ImageSource | undefined {
    const input = element as PageElement & { type?: string; src?: string };
    if (!isHtml(element, "input") || input.type !== "image") {
      return undefined;
    }
    return urlSource(input.src ?? "");
  }
}

export class VideoPosterFinder implements ImageFinder {
  find(element: PageElement): ImageSource | undefined {
    if (!isHtml(element, "video")) {
      return undefined;
    }
    return urlSource((element as PageElement & { poster: string }).poster);
  }
}

// Whatever a script drew, read out of the canvas itself.
export class CanvasFinder implements ImageFinder {
  find(element: PageElement): ImageSource | undefined {
    if (!isHtml(element, "canvas")) {
      return undefined;
    }
    return { kind: "canvas", canvas: element as PageElement & CanvasLike };
  }
}

// An <image> inside an SVG, whose href can be relative to the page.
export class SvgImageFinder implements ImageFinder {
  constructor(private readonly baseUrl: () => string) {}

  find(element: PageElement): ImageSource | undefined {
    if (
      element.localName !== "image" ||
      element.namespaceURI !== SVG_NAMESPACE
    ) {
      return undefined;
    }
    const href = (element as PageElement & { href: { baseVal: string } }).href
      .baseVal;
    if (href === "") {
      return undefined;
    }
    return { kind: "url", url: new URL(href, this.baseUrl()).href };
  }
}

// An SVG drawn in the page, saved whole. The outermost one, since an <svg> can
// nest inside another.
export class InlineSvgFinder implements ImageFinder {
  find(element: PageElement): ImageSource | undefined {
    const svg = element as SvgLike & { ownerSVGElement: unknown };
    if (
      element.localName !== "svg" ||
      element.namespaceURI !== SVG_NAMESPACE ||
      svg.ownerSVGElement !== null
    ) {
      return undefined;
    }
    return { kind: "svg", svg };
  }
}
