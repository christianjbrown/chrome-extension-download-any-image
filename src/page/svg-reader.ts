import type { Box, StyleLook, SvgLike } from "./dom";
import type { ImageSourceOf } from "./image-source";
import type { SourceReader, SvgSerializer } from "./image-reading";
import type { SVG_SOURCE } from "./svg-source";

// An SVG goes across as its own text.
const SVG_DATA_URL_PREFIX = "data:image/svg+xml;charset=utf-8,";

// The sizes an SVG is given when it does not say, and the property its shapes
// often borrow their colour from.
const SIZES = ["width", "height"] as const;
const COLOUR = "color";

// The sizes the copy does not say, as the SVG is shown on screen.
function sizeAsShown(copy: SvgLike, box: Box): void {
  SIZES.filter((name) => !copy.hasAttribute(name)).forEach((name) => {
    copy.setAttribute(name, String(box[name]));
  });
}

// An inline SVG as a file of its own: sized as it is on screen when it does not
// say, and in its current colour, which its shapes often borrow.
export class SvgReader implements SourceReader<
  ImageSourceOf<typeof SVG_SOURCE>
> {
  constructor(
    private readonly serializer: SvgSerializer,
    private readonly look: StyleLook,
  ) {}

  read(source: ImageSourceOf<typeof SVG_SOURCE>): Promise<string> {
    const svg = source.svg;
    const copy = svg.cloneNode(true);
    sizeAsShown(copy, svg.getBoundingClientRect());
    copy.style.setProperty(COLOUR, this.look(svg).getPropertyValue(COLOUR));
    const xml = this.serializer.serialize(copy);
    return Promise.resolve(`${SVG_DATA_URL_PREFIX}${encodeURIComponent(xml)}`);
  }
}
