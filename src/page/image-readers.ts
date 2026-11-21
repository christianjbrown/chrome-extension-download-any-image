import type { ImageSource, ImageSourceOf, SourceKind } from "./image-source";
import type {
  ImageReading,
  ReadersByKind,
  SourceReader,
} from "./image-reading";

// Hands each picture to the reader for its kind. A new kind is a new reader in
// the map, which the type insists on.
export class ImageReaders implements ImageReading {
  constructor(private readonly byKind: ReadersByKind) {}

  read(source: ImageSource): Promise<string> {
    return this.readOfKind(source);
  }

  private readOfKind<K extends SourceKind>(
    source: ImageSourceOf<K>,
  ): Promise<string> {
    const reader: SourceReader<ImageSourceOf<K>> = this.byKind[source.kind];
    return reader.read(source);
  }
}
