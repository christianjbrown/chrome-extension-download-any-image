import type { SvgLike } from "./dom";
import type { ElementSource } from "./element-source";
import type { SvgSerializer } from "./image-reading";

// The part of an XMLSerializer this needs.
export interface MarkupWriter {
  serializeToString(node: Element): string;
}

// A fresh writer for each picture, made only once there is one to write.
export class XmlSvgSerializer implements SvgSerializer {
  constructor(
    private readonly newWriter: () => MarkupWriter,
    private readonly elements: ElementSource,
  ) {}

  serialize(svg: SvgLike): string {
    return this.newWriter().serializeToString(this.elements.element(svg));
  }
}
