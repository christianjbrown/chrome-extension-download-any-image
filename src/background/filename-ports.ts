// What choosing a downloaded image's filename is made of.

// The whole name, extension and all, for an image from this address.
export interface FilenameChooser {
  choose(url: string, title: string, mime: string | undefined): string;
}

// A name the image had on the server, and the extension it came with.
export interface OriginalName {
  stem: string;
  extension?: string | undefined;
}

export interface OriginalNames {
  // The image's own name from its address, when it has one worth keeping.
  from(url: string): OriginalName | undefined;
}

// A name made from the page, for an image whose own name says nothing.
export interface FallbackNames {
  name(title: string): string;
}

// What time it is now, in the laptop's own time zone.
export interface Clock {
  now(): Date;
}

// The extension a file is written with, from what it really is.
export interface FileExtensions {
  for(mime: string | undefined, fromUrl: string | undefined): string;
}
