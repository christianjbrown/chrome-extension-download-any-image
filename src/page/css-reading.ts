// What reading the picture out of a CSS image value is made of.

// One CSS image function, url() or image-set() say, and the picture it names.
export interface CssImageFunction {
  readonly name: string;
  picture(args: string): string | undefined;
}
