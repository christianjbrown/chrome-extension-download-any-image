// Whether a name from an image's address is worth keeping.
export interface NameFilter {
  keeps(stem: string): boolean;
}
