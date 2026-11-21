// What reading the picture out of a CSS image value is made of.

// One CSS image function, url() or image-set() say, and the picture it names.
export interface CssImageFunction {
  readonly name: string;
  picture(args: string): string | undefined;
}

// A unit an image-set() option's density can be written in, and how many x
// one of it is.
export interface ResolutionUnit {
  readonly unit: string;
  readonly perX: number;
}
